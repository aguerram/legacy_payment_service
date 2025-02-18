export class PaginateDataTableResponse {
  totalCounts: number;
  offset: number;
  count: number;
  data: any;
  filters: {
    statuses: any;
  } = {
    statuses: {},
  };
}
