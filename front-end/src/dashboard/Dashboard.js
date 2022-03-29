import React from "react";
import { useHistory } from "react-router-dom";
import ErrorAlert from "../layout/ErrorAlert";
import { previous, today, next } from "../utils/date-time";
import ReservationsTable from "./ReservationsTable";
import TablesTable from "./TablesTable";

//defines the dashboard page
function Dashboard({
  date,
  reservations,
  reservationsError,
  tables,
  tablesError,
  loadDashboard,
}) {
  const history = useHistory();

  return (
    <main>
      <div className="d-md-flex mb-3">
        <h2 className="mb-0 pt-2">Reservations for {date}</h2>
      </div>

      <div className="btn-group pb-4">
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => history.push(`/dashboard?date=${previous(date)}`)}
        >
          Previous
        </button>
        <button
          className="btn btn-secondary "
          type="button"
          onClick={() => history.push(`/dashboard?date=${today()}`)}
        >
          Today
        </button>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => history.push(`/dashboard?date=${next(date)}`)}
        >
          Next
        </button>
      </div>

      <ErrorAlert error={reservationsError} />

      <div className="row">
        <div className="col-11">
          <ReservationsTable
            reservations={reservations}
            loadDashboard={loadDashboard}
          />
        </div>
      </div>

      <div className="d-md-flex mb-3">
        <h3 >Tables</h3>
      </div>

      <ErrorAlert error={tablesError} />

      <div className="row">
        <div className="col-11">
          <TablesTable tables={tables} loadDashboard={loadDashboard} />
        </div>
      </div>
    </main>
  );
}

export default Dashboard;