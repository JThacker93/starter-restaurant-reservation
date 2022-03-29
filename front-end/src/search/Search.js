import React, { useState } from "react";
import { listReservations } from "../utils/api";
import ReservationsTable from "../dashboard/ReservationsTable";
import ErrorAlert from "../layout/ErrorAlert";

//component that renders on /search
export default function Search() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [reservations, setReservations] = useState([]);
  const [renderReservationsTable, setRenderReservationsTable] = useState(false);
  const [error, setError] = useState(null);

  //called when user interacts with an input to store the data in a variable that we can use
  function handleChange({ target }) {
    setMobileNumber(target.value);
  }

  //invoked upon search submission, returns search results
  async function handleSubmit(event) {
    event.preventDefault();
    const abortController = new AbortController();
    setError(null);

    //*API call
    await listReservations(
      { mobile_number: mobileNumber },
      abortController.signal
    )
      .then(setReservations)
      .then(setRenderReservationsTable(true))
      .catch(setError);

    return () => abortController.abort();
  }

  return (
    <div>
      <h3>Search</h3>
      <form>
        <ErrorAlert error={error} />

        <label htmlFor="mobile_number">
          Enter a customer's phone number below:
        </label>
        <div>
          <input
            className="m-2"
            name="mobile_number"
            id="mobile_number"
            type="tel"
            onChange={handleChange}
            value={mobileNumber}
            required
          />

          <button
            className="btn btn-success"
            type="submit"
            onClick={handleSubmit}
          >
            Find
          </button>
        </div>
      </form>

      {renderReservationsTable && (
        <ReservationsTable reservations={reservations} />
      )}
    </div>
  );
}