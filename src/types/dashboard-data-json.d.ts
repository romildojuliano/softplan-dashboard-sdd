declare module '#dashboard-data' {
  import type { DashboardData } from './dashboard';

  // The extractor writes the untouched standalone source dataset.
  const data: DashboardData;
  export default data;
}
