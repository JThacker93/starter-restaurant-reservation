import { updateReservationStatus } from "../utils/api";

//component that renders a table of reservations
export default function ReservationsTable({ reservations, loadDashboard }) {
  if (!reservations || reservations.length < 1)
    return <p>No reservations found for this date. Click "New Reservation" to create one!</p>;


    //invoked when a user clicks te cancel button on a reservation
 async function handleCancel({ target }) {
    if (
      window.confirm(
        "Do you want to cancel this reservation? This cannot be undone."
      )
    ) {
      const abortController = new AbortController();

      //* API call
     await updateReservationStatus(
        target.value,
        "cancelled",
        abortController.status
      ).then(loadDashboard);

      return () => abortController.abort();
    }
  }

  //filters out cancelled reservations from rendering into the table
  const filteredReservations = [];
  for (const reservation of reservations) {
    if (reservation.status !== "cancelled") filteredReservations.push(reservation);
  }
  //if there are no active reservations, return alternate render
  if (filteredReservations.length === 0 || !filteredReservations){
    return <p>No reservations found for this date. Click "New Reservation" to create one!</p>
  };

  //map reservations into a JSX table  to be rendered
  const rows = filteredReservations.map(
    (
      {
        reservation_id,
        first_name,
        last_name,
        mobile_number,
        people,
        reservation_date,
        reservation_time,
        status,
      },
      index
    ) => (
      <tr key={reservation_id} className ="">

        <td className="text-center">{first_name}</td>
        <td className="text-center">{last_name}</td>
        <td className="text-center">{mobile_number}</td>
        <td className="text-center">{people}</td>
        <td className="text-center">{reservation_date}</td>
        <td className="text-center">{reservation_time}</td>
        <td className="text-center" data-reservation-id-status={reservation_id}>{status}</td>

        {status === "booked" && (
          <td>
            <a href={`/reservations/${reservation_id}/seat`}>
              <button className="btn btn-success rounded-pill"type="button">Seat</button>
            </a>
          </td>
        )}
        
        {status === "booked" && (
        <td>
          <a href={`/reservations/${reservation_id}/edit`}>
            <button className="btn btn-primary rounded-pill" type="button">Edit</button>
          </a>
        </td>
        )}

        <td>

      <button
        className="btn btn-danger rounded-pill"
        type="button"
        onClick={handleCancel}
        data-reservation-id-cancel={reservation_id}
        value={reservation_id}
      >
        Cancel
      </button>

        </td>

      </tr>
    )
  );

  return (
    <div className="table-wrap">

    <table className="table table-responsive-md table-hover ">
      <thead>
        <tr>
          <th className="text-center"scope="col">First Name</th>
          <th className="text-center"scope="col">Last Name</th>
          <th className="text-center"scope="col">Mobile Number</th>
          <th className="text-center"scope="col">People</th>
          <th className="text-center"scope="col">Reservation Date</th>
          <th className="text-center"scope="col">Reservation Time</th>
          <th className="text-center"scope="col">Status</th>
        </tr>
      </thead>

      <tbody>{rows}</tbody>

    </table>

    </div>
  );
}