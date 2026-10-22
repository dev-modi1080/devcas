/**
 * Shift Service — the local storage layer for the CAS platform.
 *
 * It exposes a small, familiar data access API on top of SQLite so the rest of
 * the application keeps a consistent querying surface
 * (`findMany`, `findUnique`, `create`, `upsert`, `$transaction`, ...).
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SqliteConnection } from './sqlite';
import {
  FieldDef,
  MODELS,
  ModelDef,
  RelationDef,
  buildSchemaSql,
  resolveCompoundKey,
} from './schema';

export type WhereInput = Record<string, any>;

export interface FindManyArgs {
  where?: WhereInput;
  include?: Record<string, any>;
  select?: Record<string, any>;
  orderBy?: Record<string, any> | Record<string, any>[];
  skip?: number;
  take?: number;
}

export interface FindUniqueArgs {
  where: WhereInput;
  include?: Record<string, any>;
  select?: Record<string, any>;
}

export interface CreateArgs {
  data: any;
  include?: Record<string, any>;
  select?: Record<string, any>;
}

export interface UpdateArgs {
  where: WhereInput;
  data: any;
  include?: Record<string, any>;
  select?: Record<string, any>;
}

export interface UpsertArgs {
  where: WhereInput;
  create: any;
  update: any;
  include?: Record<string, any>;
  select?: Record<string, any>;
}

/**
 * Thin per-model facade. Exposes the same verbs the application code expects.
 */
export class ModelDelegate {
  constructor(
    private readonly service: ShiftService,
    readonly modelName: string,
  ) {}

  findMany(args: FindManyArgs = {}) {
    return this.service.findMany(this.modelName, args);
  }

  findUnique(args: FindUniqueArgs) {
    return this.service.findUnique(this.modelName, args);
  }

  findFirst(args: FindManyArgs = {}) {
    return this.service.findFirst(this.modelName, args);
  }

  create(args: CreateArgs) {
    return this.service.create(this.modelName, args);
  }

  createMany(args: { data: any[]; skipDuplicates?: boolean }) {
    return this.service.createMany(this.modelName, args);
  }

  update(args: UpdateArgs) {
    return this.service.update(this.modelName, args);
  }

  updateMany(args: { where?: WhereInput; data: any }) {
    return this.service.updateMany(this.modelName, args);
  }

  upsert(args: UpsertArgs) {
    return this.service.upsert(this.modelName, args);
  }

  delete(args: { where: WhereInput }) {
    return this.service.delete(this.modelName, args);
  }

  deleteMany(args: { where?: WhereInput }) {
    return this.service.deleteMany(this.modelName, args);
  }

  count(args: { where?: WhereInput } = {}) {
    return this.service.count(this.modelName, args);
  }
}

@Injectable()
export class ShiftService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ShiftService.name);
  private connection: SqliteConnection;
  private transactionDepth = 0;
  private aliasCounter = 0;

  // Model delegates -------------------------------------------------------
  readonly user: ModelDelegate;
  readonly business: ModelDelegate;
  readonly company: ModelDelegate;
  readonly location: ModelDelegate;
  readonly siteLocation: ModelDelegate;
  readonly greenZone: ModelDelegate;
  readonly userBusiness: ModelDelegate;
  readonly userLocation: ModelDelegate;
  readonly userSiteLocation: ModelDelegate;
  readonly plantationCategory: ModelDelegate;
  readonly plantationType: ModelDelegate;
  readonly botanical: ModelDelegate;
  readonly irrigationType: ModelDelegate;
  readonly distanceRowToRow: ModelDelegate;
  readonly distancePlantToPlant: ModelDelegate;
  readonly expenseCategory: ModelDelegate;
  readonly greenZoneRequest: ModelDelegate;
  readonly greenZoneRequestPhoto: ModelDelegate;
  readonly misYearlyBudget: ModelDelegate;
  readonly misMonthlyExpense: ModelDelegate;
  readonly misAttachment: ModelDelegate;
  readonly treeTarget: ModelDelegate;
  readonly treeTargetHistory: ModelDelegate;
  readonly treeOpeningBalance: ModelDelegate;
  readonly workflowInstance: ModelDelegate;
  readonly workflowStepHistory: ModelDelegate;
  readonly notification: ModelDelegate;
  readonly emailLog: ModelDelegate;
  readonly systemSetting: ModelDelegate;
  readonly fileAsset: ModelDelegate;

  constructor() {
    this.connection = new SqliteConnection();

    this.user = this.delegate('User');
    this.business = this.delegate('Business');
    this.company = this.delegate('Company');
    this.location = this.delegate('Location');
    this.siteLocation = this.delegate('SiteLocation');
    this.greenZone = this.delegate('GreenZone');
    this.userBusiness = this.delegate('UserBusiness');
    this.userLocation = this.delegate('UserLocation');
    this.userSiteLocation = this.delegate('UserSiteLocation');
    this.plantationCategory = this.delegate('PlantationCategory');
    this.plantationType = this.delegate('PlantationType');
    this.botanical = this.delegate('Botanical');
    this.irrigationType = this.delegate('IrrigationType');
    this.distanceRowToRow = this.delegate('DistanceRowToRow');
    this.distancePlantToPlant = this.delegate('DistancePlantToPlant');
    this.expenseCategory = this.delegate('ExpenseCategory');
    this.greenZoneRequest = this.delegate('GreenZoneRequest');
    this.greenZoneRequestPhoto = this.delegate('GreenZoneRequestPhoto');
    this.misYearlyBudget = this.delegate('MisYearlyBudget');
    this.misMonthlyExpense = this.delegate('MisMonthlyExpense');
    this.misAttachment = this.delegate('MisAttachment');
    this.treeTarget = this.delegate('TreeTarget');
    this.treeTargetHistory = this.delegate('TreeTargetHistory');
    this.treeOpeningBalance = this.delegate('TreeOpeningBalance');
    this.workflowInstance = this.delegate('WorkflowInstance');
    this.workflowStepHistory = this.delegate('WorkflowStepHistory');
    this.notification = this.delegate('Notification');
    this.emailLog = this.delegate('EmailLog');
    this.systemSetting = this.delegate('SystemSetting');
    this.fileAsset = this.delegate('FileAsset');
  }

  private delegate(modelName: string): ModelDelegate {
    return new ModelDelegate(this, modelName);
  }

  /**
   * Creates a service bound to a specific connection. Used by the CLI and the
   * seed script, which run outside of the Nest dependency injection context.
   */
  static standalone(connection?: SqliteConnection): ShiftService {
    const service = new ShiftService();
    if (connection) service.connection = connection;
    return service;
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  async onModuleInit(): Promise<void> {
    this.ensureSchema();
    try {
      const userCount = await this.user.count();
      if (userCount === 0) {
        this.logger.log('Database empty. Seeding initial CAS dataset...');
        const { seed } = await import('./seed');
        await seed(this);
        this.logger.log('Initial CAS dataset seeded.');
      }
    } catch (err) {
      this.logger.warn(`Auto-seeding check: ${err}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.connection.close();
  }

  /** Absolute path of the SQLite file backing this service. */
  get databaseFile(): string {
    return this.connection.file;
  }

  /** Creates the schema when it does not exist yet. Safe to call repeatedly. */
  ensureSchema(): void {
    for (const statement of buildSchemaSql()) {
      this.connection.exec(statement);
    }
  }

  /** Removes every table and recreates an empty schema. */
  resetSchema(): void {
    this.connection.exec('PRAGMA foreign_keys = OFF');
    for (const model of Object.values(MODELS)) {
      this.connection.exec(`DROP TABLE IF EXISTS "${model.table}"`);
    }
    this.connection.exec('PRAGMA foreign_keys = ON');
    this.ensureSchema();
  }

  // -----------------------------------------------------------------------
  // Query API
  // -----------------------------------------------------------------------

  async findMany(modelName: string, args: FindManyArgs = {}): Promise<any[]> {
    const model = this.getModel(modelName);
    const where = this.buildWhere(args.where, modelName, model.table);

    const parts = [`SELECT * FROM "${model.table}"`];
    if (where.sql) parts.push(`WHERE ${where.sql}`);

    const orderBy = this.buildOrderBy(args.orderBy, model.table);
    if (orderBy) parts.push(`ORDER BY ${orderBy}`);

    const hasTake = args.take !== undefined && args.take !== null;
    const hasSkip = args.skip !== undefined && args.skip !== null;
    if (hasTake) parts.push(`LIMIT ${Math.max(0, Number(args.take))}`);
    if (hasSkip) {
      if (!hasTake) parts.push('LIMIT -1');
      parts.push(`OFFSET ${Math.max(0, Number(args.skip))}`);
    }

    const rows = this.connection.all<any>(parts.join(' '), where.params);
    let result = rows.map((row) => this.hydrate(row, modelName));

    if (args.select) result = result.map((row) => this.project(row, args.select, modelName));
    if (args.include) await this.loadRelations(result, modelName, args.include);

    return result;
  }

  async findUnique(modelName: string, args: FindUniqueArgs): Promise<any> {
    const where = this.normalizeUniqueWhere(modelName, args.where);
    const rows = await this.findMany(modelName, { ...args, where, take: 1 });
    return rows.length ? rows[0] : null;
  }

  async findFirst(modelName: string, args: FindManyArgs = {}): Promise<any> {
    const rows = await this.findMany(modelName, { ...args, take: 1 });
    return rows.length ? rows[0] : null;
  }

  async create(modelName: string, args: CreateArgs): Promise<any> {
    const model = this.getModel(modelName);
    const scalars: any = {};
    const nested: Record<string, any> = {};

    for (const [key, value] of Object.entries(args.data || {})) {
      if (model.fields[key]) scalars[key] = value;
      else if (model.relations[key]) nested[key] = value;
    }

    const row = this.buildRow(model, scalars);
    this.insertRow(model, row);

    for (const [relationName, operations] of Object.entries(nested)) {
      await this.applyNestedOperations(modelName, relationName, operations, row);
    }

    return this.findUnique(modelName, {
      where: { id: row.id },
      include: args.include,
      select: args.select,
    });
  }

  async createMany(modelName: string, args: { data: any[]; skipDuplicates?: boolean }): Promise<{ count: number }> {
    const model = this.getModel(modelName);
    let count = 0;

    for (const item of args.data || []) {
      const row = this.buildRow(model, item);
      try {
        this.insertRow(model, row, args.skipDuplicates);
        count += 1;
      } catch (error) {
        if (!args.skipDuplicates) throw error;
      }
    }

    return { count };
  }

  async update(modelName: string, args: UpdateArgs): Promise<any> {
    const model = this.getModel(modelName);
    const where = this.normalizeUniqueWhere(modelName, args.where);

    const existing = await this.findMany(modelName, { where, take: 1 });
    if (!existing.length) {
      throw new Error(`Cannot update ${modelName}: no record matched the supplied identifier.`);
    }
    const current = existing[0];

    const sets: string[] = [];
    const params: any[] = [];
    const nested: Record<string, any> = {};

    for (const [key, value] of Object.entries(args.data || {})) {
      if (model.fields[key]) {
        if (value === undefined) continue;
        sets.push(`"${key}" = ?`);
        params.push(this.toStorage(model.fields[key], value));
      } else if (model.relations[key]) {
        nested[key] = value;
      }
    }

    const updatedAtField = this.getUpdatedAtField(model);
    if (updatedAtField) {
      sets.push(`"${updatedAtField[0]}" = ?`);
      params.push(this.toStorage(updatedAtField[1], new Date()));
    }

    if (sets.length) {
      const condition = this.buildWhere(where, modelName, model.table);
      if (!condition.sql) throw new Error(`Cannot update ${modelName} without a valid identifier.`);
      this.connection.run(
        `UPDATE "${model.table}" SET ${sets.join(', ')} WHERE ${condition.sql}`,
        [...params, ...condition.params],
      );
    }

    for (const [relationName, operations] of Object.entries(nested)) {
      await this.applyNestedOperations(modelName, relationName, operations, current);
    }

    return this.findUnique(modelName, {
      where: { id: current.id },
      include: args.include,
      select: args.select,
    });
  }

  async updateMany(modelName: string, args: { where?: WhereInput; data: any }): Promise<{ count: number }> {
    const model = this.getModel(modelName);
    const sets: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(args.data || {})) {
      if (!model.fields[key]) continue;
      if (value === undefined) continue;
      sets.push(`"${key}" = ?`);
      params.push(this.toStorage(model.fields[key], value));
    }

    const updatedAtField = this.getUpdatedAtField(model);
    if (updatedAtField) {
      sets.push(`"${updatedAtField[0]}" = ?`);
      params.push(this.toStorage(updatedAtField[1], new Date()));
    }

    if (!sets.length) return { count: 0 };

    const condition = this.buildWhere(args.where, modelName, model.table);
    if (!condition.sql) throw new Error(`Cannot update ${modelName} without a where clause.`);

    const result = this.connection.run(
      `UPDATE "${model.table}" SET ${sets.join(', ')} WHERE ${condition.sql}`,
      [...params, ...condition.params],
    );
    return { count: result.changes };
  }

  async upsert(modelName: string, args: UpsertArgs): Promise<any> {
    const where = this.normalizeUniqueWhere(modelName, args.where);
    const existing = await this.findMany(modelName, { where, take: 1 });

    if (existing.length) {
      return this.update(modelName, {
        where,
        data: args.update || {},
        include: args.include,
        select: args.select,
      });
    }

    return this.create(modelName, {
      data: args.create || {},
      include: args.include,
      select: args.select,
    });
  }

  async delete(modelName: string, args: { where: WhereInput }): Promise<any> {
    const where = this.normalizeUniqueWhere(modelName, args.where);
    const existing = await this.findMany(modelName, { where, take: 1 });
    if (!existing.length) {
      throw new Error(`Cannot delete ${modelName}: no record matched the supplied identifier.`);
    }

    const condition = this.buildWhere(where, modelName, this.getModel(modelName).table);
    this.connection.run(
      `DELETE FROM "${this.getModel(modelName).table}" WHERE ${condition.sql}`,
      condition.params,
    );

    return existing[0];
  }

  async deleteMany(modelName: string, args: { where?: WhereInput } = {}): Promise<{ count: number }> {
    const model = this.getModel(modelName);
    const condition = this.buildWhere(args?.where, modelName, model.table);
    if (!condition.sql) {
      this.logger.warn(`Deleting every record from "${model.table}" because no where clause was supplied.`);
    }

    const result = this.connection.run(
      `DELETE FROM "${model.table}"${condition.sql ? ` WHERE ${condition.sql}` : ''}`,
      condition.params,
    );
    return { count: result.changes };
  }

  async count(modelName: string, args: { where?: WhereInput } = {}): Promise<number> {
    const model = this.getModel(modelName);
    const condition = this.buildWhere(args.where, modelName, model.table);
    const sql = `SELECT COUNT(*) AS total FROM "${model.table}"${condition.sql ? ` WHERE ${condition.sql}` : ''}`;
    const row = this.connection.get<{ total: number }>(sql, condition.params);
    return Number(row?.total ?? 0);
  }

  // -----------------------------------------------------------------------
  // Transactions
  // -----------------------------------------------------------------------

  async $transaction<T>(operations: ((tx: ShiftService) => Promise<T>) | Promise<T>[]): Promise<any> {
    if (Array.isArray(operations)) {
      const results: any[] = [];
      for (const operation of operations) results.push(await operation);
      return results;
    }

    const nested = this.transactionDepth > 0;
    const savepoint = `shift_sp_${this.transactionDepth}`;

    if (nested) this.connection.exec(`SAVEPOINT ${savepoint}`);
    else this.connection.exec('BEGIN');
    this.transactionDepth += 1;

    try {
      const result = await operations(this);
      this.transactionDepth -= 1;
      if (nested) this.connection.exec(`RELEASE ${savepoint}`);
      else this.connection.exec('COMMIT');
      return result;
    } catch (error) {
      this.transactionDepth -= 1;
      if (nested) this.connection.exec(`ROLLBACK TO ${savepoint}; RELEASE ${savepoint}`);
      else this.connection.exec('ROLLBACK');
      throw error;
    }
  }

  // -----------------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------------

  private getModel(modelName: string): ModelDef {
    const model = MODELS[modelName];
    if (!model) throw new Error(`Unknown model "${modelName}".`);
    return model;
  }

  private getUpdatedAtField(model: ModelDef): [string, FieldDef] | null {
    const entry = Object.entries(model.fields).find(([, def]) => def.updatedAt);
    return entry ? [entry[0], entry[1]] : null;
  }

  /**
   * Converts a compound unique key into a plain field filter.
   */
  private normalizeUniqueWhere(modelName: string, where: WhereInput): WhereInput {
    if (!where || typeof where !== 'object') return {};
    const keys = Object.keys(where);
    if (keys.length === 1) {
      const key = keys[0];
      const columns = resolveCompoundKey(modelName, key);
      if (columns) {
        const flattened: any = {};
        for (const column of columns) flattened[column] = (where as any)[key][column];
        return flattened;
      }
    }
    return where;
  }

  private buildOrderBy(orderBy: any, alias: string): string {
    if (!orderBy) return '';
    const parts: string[] = [];

    const visit = (source: any) => {
      for (const [field, direction] of Object.entries(source || {})) {
        if (direction && typeof direction === 'object') {
          visit(direction);
          continue;
        }
        const order = String(direction).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
        parts.push(`${alias}."${field}" ${order}`);
      }
    };

    if (Array.isArray(orderBy)) orderBy.forEach(visit);
    else visit(orderBy);

    return parts.join(', ');
  }

  /**
   * Translates a `where` object into a SQL fragment.
   */
  private buildWhere(
    where: WhereInput | undefined,
    modelName: string,
    alias: string,
  ): { sql: string; params: any[] } {
    if (!where || typeof where !== 'object') return { sql: '', params: [] };

    const model = this.getModel(modelName);
    const parts: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(where)) {
      if (value === undefined) continue;

      if (key === 'OR' || key === 'AND') {
        const clauses = (Array.isArray(value) ? value : [value]).filter(Boolean);
        if (!clauses.length) continue;
        const built = clauses.map((clause) => this.buildWhere(clause, modelName, alias));
        const joiner = key === 'OR' ? ' OR ' : ' AND ';
        const combined = built
          .map((entry) => entry.sql)
          .filter(Boolean)
          .join(joiner);
        if (!combined) continue;
        parts.push(`(${combined})`);
        built.forEach((entry) => params.push(...entry.params));
        continue;
      }

      if (key === 'NOT') {
        const built = this.buildWhere(value, modelName, alias);
        if (!built.sql) continue;
        parts.push(`NOT (${built.sql})`);
        params.push(...built.params);
        continue;
      }

      const relation = model.relations[key];
      if (relation) {
        const fragment = this.buildRelationCondition(relation, value, alias);
        parts.push(fragment.sql);
        params.push(...fragment.params);
        continue;
      }

      const field = model.fields[key];
      if (!field) continue;

      const fragment = this.buildFieldCondition(alias, key, value, field);
      if (!fragment) continue;
      parts.push(fragment.sql);
      params.push(...fragment.params);
    }

    return { sql: parts.join(' AND '), params };
  }

  private buildRelationCondition(
    relation: RelationDef,
    value: any,
    alias: string,
  ): { sql: string; params: any[] } {
    const target = this.getModel(relation.model);
    const targetAlias = `rel_${++this.aliasCounter}`;
    const built = this.buildWhere(value, relation.model, targetAlias);
    const inner = built.sql || '1 = 1';

    if (relation.kind === 'one') {
      return {
        sql: `${alias}."${relation.fk}" IN (SELECT ${targetAlias}."id" FROM "${target.table}" ${targetAlias} WHERE ${inner})`,
        params: built.params,
      };
    }

    return {
      sql: `EXISTS (SELECT 1 FROM "${target.table}" ${targetAlias} WHERE ${targetAlias}."${relation.fk}" = ${alias}."id" AND (${inner}))`,
      params: built.params,
    };
  }

  private buildFieldCondition(
    alias: string,
    name: string,
    value: any,
    field: FieldDef,
  ): { sql: string; params: any[] } | null {
    const column = `${alias}."${name}"`;

    if (value === null) return { sql: `${column} IS NULL`, params: [] };

    if (value instanceof Date || typeof value !== 'object') {
      return { sql: `${column} = ?`, params: [this.toStorage(field, value)] };
    }

    const parts: string[] = [];
    const params: any[] = [];

    for (const [operator, operand] of Object.entries(value as Record<string, any>)) {
      if (operand === undefined) continue;

      switch (operator) {
        case 'in': {
          const list = (Array.isArray(operand) ? operand : [operand]).map((item) => this.toStorage(field, item));
          if (!list.length) {
            parts.push('1 = 0');
            break;
          }
          parts.push(`${column} IN (${list.map(() => '?').join(', ')})`);
          params.push(...list);
          break;
        }
        case 'notIn': {
          const list = (Array.isArray(operand) ? operand : [operand]).map((item) => this.toStorage(field, item));
          if (!list.length) break;
          parts.push(`${column} NOT IN (${list.map(() => '?').join(', ')})`);
          params.push(...list);
          break;
        }
        case 'equals':
          parts.push(`${column} = ?`);
          params.push(this.toStorage(field, operand));
          break;
        case 'not':
        case 'ne':
          parts.push(`${column} <> ?`);
          params.push(this.toStorage(field, operand));
          break;
        case 'gt':
          parts.push(`${column} > ?`);
          params.push(this.toStorage(field, operand));
          break;
        case 'gte':
          parts.push(`${column} >= ?`);
          params.push(this.toStorage(field, operand));
          break;
        case 'lt':
          parts.push(`${column} < ?`);
          params.push(this.toStorage(field, operand));
          break;
        case 'lte':
          parts.push(`${column} <= ?`);
          params.push(this.toStorage(field, operand));
          break;
        case 'contains': {
          const text = `%${String(operand)}%`;
          if ((value as any).mode === 'insensitive') {
            parts.push(`LOWER(${column}) LIKE LOWER(?)`);
            params.push(text);
          } else {
            parts.push(`${column} LIKE ?`);
            params.push(text);
          }
          break;
        }
        case 'startsWith': {
          const text = `${String(operand)}%`;
          if ((value as any).mode === 'insensitive') {
            parts.push(`LOWER(${column}) LIKE LOWER(?)`);
            params.push(text);
          } else {
            parts.push(`${column} LIKE ?`);
            params.push(text);
          }
          break;
        }
        case 'endsWith': {
          const text = `%${String(operand)}`;
          if ((value as any).mode === 'insensitive') {
            parts.push(`LOWER(${column}) LIKE LOWER(?)`);
            params.push(text);
          } else {
            parts.push(`${column} LIKE ?`);
            params.push(text);
          }
          break;
        }
        case 'mode':
        default:
          break;
      }
    }

    if (!parts.length) return null;
    return { sql: parts.join(' AND '), params };
  }

  private async loadRelations(rows: any[], modelName: string, include: Record<string, any>): Promise<any[]> {
    if (!rows.length) return rows;
    const model = this.getModel(modelName);

    for (const [relationName, relationArgs] of Object.entries(include || {})) {
      const relation = model.relations[relationName];
      if (!relation) continue;

      const options = relationArgs && relationArgs !== true ? relationArgs : {};
      for (const row of rows) {
        row[relationName] =
          relation.kind === 'one'
            ? await this.loadSingleRelation(relation, options, row)
            : await this.loadMultipleRelations(relation, options, row);
      }
    }

    return rows;
  }

  private async loadSingleRelation(
    relation: RelationDef,
    options: any,
    parent: any,
  ): Promise<any> {
    const foreignKey = parent[relation.fk];
    if (foreignKey === null || foreignKey === undefined) return null;

    const { where, ...rest } = options || {};
    const scope = where ? { AND: [{ id: foreignKey }, where] } : { id: foreignKey };
    const rows = await this.findMany(relation.model, { ...rest, where: scope, take: 1 });
    return rows.length ? rows[0] : null;
  }

  private async loadMultipleRelations(relation: RelationDef, options: any, parent: any): Promise<any[]> {
    const { where, ...rest } = options || {};
    const scope = { [relation.fk]: parent.id };
    const merged = where ? { AND: [scope, where] } : scope;
    return this.findMany(relation.model, { ...rest, where: merged });
  }

  private project(row: any, select: Record<string, any>, modelName: string): any {
    const model = this.getModel(modelName);
    const projected: any = {};
    for (const [field, enabled] of Object.entries(select || {})) {
      if (!enabled) continue;
      if (model.fields[field]) projected[field] = row[field];
    }
    return projected;
  }

  private buildRow(model: ModelDef, data: any): any {
    const row: any = {};
    for (const [name, def] of Object.entries(model.fields)) {
      let value = data?.[name];
      if (value === undefined) {
        if (def.default === 'now') value = new Date();
        else if (def.default !== undefined) value = def.default;
        else if (name === 'id') value = randomUUID();
        else value = null;
      }
      row[name] = value;
    }
    return row;
  }

  private insertRow(model: ModelDef, row: any, ignoreDuplicates = false): void {
    const columns = Object.keys(row);
    const sql = `INSERT ${ignoreDuplicates ? 'OR IGNORE ' : ''}INTO "${model.table}" (${columns
      .map((column) => `"${column}"`)
      .join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
    const params = columns.map((column) => this.toStorage(model.fields[column], row[column]));

    try {
      this.connection.run(sql, params);
    } catch (error) {
      this.logger.error(
        `Failed to insert into "${model.table}": ${error?.message ?? error}`,
        JSON.stringify(Object.fromEntries(columns.map((column, index) => [column, params[index]]))),
      );
      throw error;
    }
  }

  private async applyNestedOperations(
    modelName: string,
    relationName: string,
    operations: any,
    parent: any,
  ): Promise<void> {
    const model = this.getModel(modelName);
    const relation = model.relations[relationName];
    if (!relation || !operations || typeof operations !== 'object') return;

    const target = this.getModel(relation.model);

    if (relation.kind === 'many') {
      const scope = { [relation.fk]: parent.id };

      const children = Array.isArray(operations.create)
        ? operations.create
        : operations.create
          ? [operations.create]
          : [];
      for (const child of children) {
        this.insertChild(relation.model, child, scope);
      }

      if (operations.createMany?.data) {
        for (const child of operations.createMany.data) {
          this.insertChild(relation.model, child, scope);
        }
      }

      if (operations.deleteMany) {
        const where = operations.deleteMany.where
          ? { AND: [scope, operations.deleteMany.where] }
          : scope;
        await this.deleteMany(relation.model, { where });
      }

      if (operations.delete) {
        await this.delete(relation.model, { where: operations.delete.where });
      }

      if (operations.update) {
        const where = operations.update.where
          ? { AND: [scope, operations.update.where] }
          : scope;
        await this.updateMany(relation.model, { where, data: operations.update.data || {} });
      }

      if (operations.set) {
        this.connection.run(
          `UPDATE "${target.table}" SET "${relation.fk}" = NULL WHERE "${relation.fk}" = ?`,
          [parent.id],
        );
        for (const id of operations.set) {
          this.connection.run(
            `UPDATE "${target.table}" SET "${relation.fk}" = ? WHERE "id" = ?`,
            [parent.id, id],
          );
        }
      }

      if (operations.connect) {
        const rows = await this.findMany(relation.model, { where: operations.connect.where, take: 1 });
        if (rows.length) {
          this.connection.run(
            `UPDATE "${target.table}" SET "${relation.fk}" = ? WHERE "id" = ?`,
            [parent.id, rows[0].id],
          );
        }
      }

      return;
    }

    // Belongs-to relation: the foreign key lives on the parent record.
    if (operations.create) {
      const created = this.insertChild(relation.model, operations.create, {});
      this.connection.run(
        `UPDATE "${model.table}" SET "${relation.fk}" = ? WHERE "id" = ?`,
        [created.id, parent.id],
      );
    }

    if (operations.connect) {
      const rows = await this.findMany(relation.model, { where: operations.connect.where, take: 1 });
      if (rows.length) {
        this.connection.run(
          `UPDATE "${model.table}" SET "${relation.fk}" = ? WHERE "id" = ?`,
          [rows[0].id, parent.id],
        );
      }
    }

    if (operations.set === null) {
      this.connection.run(`UPDATE "${model.table}" SET "${relation.fk}" = NULL WHERE "id" = ?`, [parent.id]);
    }
  }

  private insertChild(modelName: string, data: any, scope: Record<string, any>): any {
    const model = this.getModel(modelName);
    const scalars: any = {};

    for (const [key, value] of Object.entries(data || {})) {
      if (model.fields[key]) scalars[key] = value;
    }
    Object.assign(scalars, scope);

    const row = this.buildRow(model, scalars);
    this.insertRow(model, row);
    return row;
  }

  private toStorage(field: FieldDef, value: any): any {
    if (value === null || value === undefined) return null;

    switch (field.type) {
      case 'bool':
        return value ? 1 : 0;
      case 'int':
        return Math.trunc(Number(value));
      case 'float':
        return Number(value);
      case 'datetime':
        return value instanceof Date ? value.toISOString() : String(value);
      default:
        return typeof value === 'string' ? value : String(value);
    }
  }

  private fromStorage(field: FieldDef, value: any): any {
    if (value === null || value === undefined) return null;

    switch (field.type) {
      case 'bool':
        return value === 1 || value === true || value === '1';
      case 'int':
      case 'float':
        return Number(value);
      case 'datetime':
        return value instanceof Date ? value : new Date(value);
      default:
        return value;
    }
  }

  private hydrate(row: any, modelName: string): any {
    const model = this.getModel(modelName);
    const hydrated: any = {};
    for (const [name, def] of Object.entries(model.fields)) {
      if (!(name in row)) continue;
      hydrated[name] = this.fromStorage(def, row[name]);
    }
    return hydrated;
  }
}
