export interface IQueryHandler<TQuery> {
    handle(query: TQuery): Promise<any>;
}
