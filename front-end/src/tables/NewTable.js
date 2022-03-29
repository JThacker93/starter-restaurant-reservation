import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import ErrorAlert from "../layout/ErrorAlert";
import { createTable } from "../utils/api";

export default function NewTable({ loadDashboard }) {
  const history = useHistory();

  const [error, setError] = useState(null);

  // initial empty form state
  const [formData, setFormData] = useState({
    table_name: "",
    capacity: "",
  });

  //updates form data as the user types into the form
  function handleChange({ target }) {
    setFormData({
      ...formData,
      [target.name]:
        target.name === "capacity" ? Number(target.value) : target.value,
    });
  }

  //submit handler for the new table form
  async function handleSubmit(event) {
    event.preventDefault();
    const abortController = new AbortController();

    if (!validateFields()) {
      createTable(formData, abortController.abort())
        .then(loadDashboard)
        .then(() => history.push(`/dashboard`))
        .catch(setError);
    }
    return () => abortController.abort();
  }

  //makes sure both fields are filled in correctly
  function validateFields() {
    let foundError = null;

    if (formData.table_name === "" || formData.capacity === "") {
      foundError = { message: "Please fill out all fields." };
    } else if (formData.table_name.length < 2) {
      foundError = { message: "Table name must be at least 2 characters." };
    }

    if (formData.capacity < 1) {
      foundError = { message: "Capacity cannot be less than 1." };
    }

    setError(foundError);

    return foundError !== null;
  }

  return (
    <div>
      <ErrorAlert error={error} />
      <form className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="table_name" className="form-label">
            Table Name:
          </label>
          <input
            className="form-control"
            name="table_name"
            id="table_name"
            type="text"
            onChange={handleChange}
            value={formData.table_name}
            required
          />
        </div>
        <div className="col-md-6 mb-3">
          <label htmlFor="capacity" className="form-label">
            Capacity:
          </label>
          <input
            className="form-control"
            id="capacity"
            type="number"
            name="capacity"
            onChange={handleChange}
            value={formData.capacity}
            min="1"
            required
          />
        </div>
        <div className="btn-group col-md-3">
          <button
            className="btn btn-success p-1"
            type="submit"
            onClick={handleSubmit}
          >
            Submit
          </button>
          <button
            className="btn btn-danger p-1"
            type="button"
            onClick={history.goBack}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}