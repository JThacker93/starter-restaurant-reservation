import { freeTable } from "../utils/api";

export default function TablesTables({ tables, loadDashboard }) {
  if (!tables || tables.length < 1) {
    return (
      <p>No tables loaded.</p>
    )
  };

  //invoked when a user clicks the finish button next to a table
   async function handleFinish({ target }) {
    if (window.confirm("Is this table ready to seat new guests? This cannot be undone.")) {
      const abortController = new AbortController();

      //*API call
      await freeTable(target.value, abortController.signal).then(loadDashboard);

      return () => abortController.abort(); 
    }
  }

  //map reservations into a JSX table  to be rendered
  const rows = tables.map(
    ({ table_id, table_name, capacity, status }, index) => (
      <tr key={table_id}>
        <th scope="row" className="text-center">{table_id}</th>
        <td className="text-center">{table_name}</td>
        <td className="text-center">{capacity}</td>
        <td data-table-id-status={table_id} className="text-center">{status}</td>
        {status === "occupied" && (
          <td className="">
            <button 
              data-table-id-finish={table_id}
              value ={table_id}
              onClick={handleFinish} 
              type="button"
              className="btn btn-warning rounded-pill"
              >
              Finish
            </button>
          </td>
        )}
          </tr>
    )
  );

  return (
    <table className="table table-hover">
      <thead>
        <tr>
          <th scope="col" className="text-center">ID</th>
          <th scope="col" className="text-center">Table Name</th>
          <th scope="col" className="text-center">Capacity</th>
          <th scope="col" className="text-center">Status</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}