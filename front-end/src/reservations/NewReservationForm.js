import React, { useState, useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import ErrorAlert from "../layout/ErrorAlert";
import formatReservationTime from "../utils/format-reservation-time"
import {
  createReservation,
  editReservation,
  listReservations,
} from "../utils/api";

export default function NewReservationForm({ loadDashboard, edit }) {
  const history = useHistory();
  const { reservation_id } = useParams();

  //object that we can use the clear the form, i.e. upon re-render
  const initialFormState = {
    first_name: "",
    last_name: "",
    mobile_number: "",
    people: "",
    reservation_date: "",
    reservation_time: "",
  };

  //dynamic variables we want to keep track of
  const [formData, setFormData] = useState({ ...initialFormState });
  const [reservationErrors, setReservationErrors] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState([]);
  const [foundReservation, setFoundReservation] = useState(null);
  const [invalidIdError, setInvalidIdError] = useState(null);

  //this useEffect loads the existing reservation data that we are editing into the form
  useEffect(() => {
    if (edit) {
      if (!reservation_id) return null;

      //invokes API call and returns reservation we are editing and setting variables accordingly
      loadReservations()
        .then((response) =>
          response.find(
            (reservation) =>
              reservation.reservation_id === Number(reservation_id)
          )
        )
        .then(fillFields)
        .catch(setInvalidIdError);
    }

    function fillFields(apiReservation) {
      if (!apiReservation || apiReservation.status !== "booked") {
        return <p>Only booked reservations can be edited.</p>;
      }

      setFoundReservation(apiReservation);

      formatReservationTime(apiReservation)

      setFormData({
        first_name: apiReservation.first_name,
        last_name: apiReservation.last_name,
        mobile_number: apiReservation.mobile_number,
        reservation_date: apiReservation.reservation_date,
        reservation_time: apiReservation.reservation_time,
        people: apiReservation.people,
      });
    }

    async function loadReservations() {
      const abortController = new AbortController();
      return await listReservations(null, abortController.signal).catch(
        setReservationErrors
      );
    }
  }, [edit, reservation_id]);

  function handleChange({ target }) {
    setFormData({
      ...formData,
      [target.name]:
        target.name === "people" ? Number(target.value) : target.value,
    });
  }

  //makes the API call to create the reservation in the database once the form is submitted
  async function handleSubmit(event) {
    event.preventDefault();
    const abortController = new AbortController();
    const foundErrors = [];

    if (validateDate(foundErrors) && validateFields(foundErrors)) {
      //* API call here
      if (edit) {
        editReservation(reservation_id, formData, abortController.signal)
          .then(loadDashboard)
          .then(() =>
            history.push(`/dashboard?date=${formData.reservation_date}`)
          )
          .catch(setApiError);
      } else {
        createReservation(formData, abortController.signal)
          .then(loadDashboard)
          .then(() =>
            history.push(`/dashboard?date=${formData.reservation_date}`)
          )
          .catch(setApiError);
      }
    }

    if (foundErrors.length > 0) setErrors(foundErrors);

    return () => abortController.abort();
  }

  //the validation function to ensure that the date and time being set for the reservation are during the restaurants open hours
  function validateDate(foundErrors) {
    const reserveDate = new Date(
      `${formData.reservation_date}T${formData.reservation_time}:00.000`);
    const todaysDate = new Date();

    if (reserveDate.getDay() === 2) {
      foundErrors.push({
        message:
          "Reservation cannot be made: Restaurant is closed on Tuesdays.",
      });
    }

    if (reserveDate < todaysDate) {
      foundErrors.push({
        message: "Reservation cannot be made: Date/Time is in the past.",
      });
    }

    if (
      reserveDate.getHours() < 10 ||
      (reserveDate.getHours() === 10 && reserveDate.getMinutes() < 30)
    ) {
      foundErrors.push({
        message:
          "Reservation cannot be made: Restaurant is not open until 10:30AM.",
      });
    } else if (
      reserveDate.getHours() > 22 ||
      (reserveDate.getHours() === 22 && reserveDate.getMinutes() >= 30)
    ) {
      foundErrors.push({
        message:
          "Reservation cannot be made: Restaurant is closed after 10:30PM.",
      });
    } else if (
      reserveDate.getHours() > 21 ||
      (reserveDate.getHours() === 21 && reserveDate.getMinutes() > 30)
    ) {
      foundErrors.push({
        message:
          "Reservation cannot be made: Reservation must be made at least an hour before closing (10:30PM).",
      });
    }

    return foundErrors.length === 0;
  }

  //verifies all required fields exist and contain valid data
  function validateFields(foundErrors) {
    for (const field in formData) {
      if (formData[field] === "") {
        foundErrors.push({
          message: `Reservation cannot be made: ${field
            .split("_")
            .join(" ")} cannot be left blank.`,
        });
      }
    }

    if (formData.people <= 0) {
      foundErrors.push({
        message: "Reservation cannot be made: Must have at least 1 guest.",
      });
    }

    return foundErrors.length === 0;
  }

  //if the requested reservation to be edited is invalid or doesnt exist, return alternate render
  if (edit) {
    if (!foundReservation || foundReservation.status !== "booked") {
      if (invalidIdError) {
        return (
          <div>
            <h4>Reservation does not exist!</h4>
            <button className="btn btn-danger" onClick={() => history.goBack()}>
              Go Back
            </button>
          </div>
        );
      } else {
        return (
          <div>
            <h4>Only booked reservations can be edited!</h4>
            <button className="btn btn-danger" onClick={() => history.goBack()}>
              Go Back
            </button>
          </div>
        );
      }
    }
  }

  function errorsJSX() {
    return errors.map((error, index) => (
      <ErrorAlert key={index} error={error} />
    ));
  }

  return (
    <div>
      {errorsJSX()}
      <ErrorAlert error={apiError} />
      <ErrorAlert error={reservationErrors} />
      <div>
        <form className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="first_name" className="form-label">
              First Name
            </label>
            <input
              className="form-control"
              id="first_name"
              type="text"
              name="first_name"
              onChange={handleChange}
              value={formData.first_name}
              minLength="2"
              required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="last_name" className="form-label">
              Last Name
            </label>
            <input
              className="form-control"
              id="last_name"
              type="text"
              name="last_name"
              onChange={handleChange}
              value={formData.last_name}
              minLength="2"
              required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="mobile_number" className="form-label">
              Mobile Number
            </label>
            <input
              className="form-control"
              id="mobile_number"
              type="tel"
              name="mobile_number"
              onChange={handleChange}
              value={formData.mobile_number}
              required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="reservation_date" className="form-label">
              Reservation Date
            </label>
            <input
              className="form-control"
              id="reservation_date"
              type="date"
              name="reservation_date"
              onChange={handleChange}
              value={formData.reservation_date}
              required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="reservation_time" className="form-label">
              Reservation Time
            </label>
            <input
              className="form-control"
              id="reservation_time"
              type="time"
              name="reservation_time"
              onChange={handleChange}
              value={formData.reservation_time}
              required
            />
          </div>
          <div className="col-md-6 c">
            <label htmlFor="people" className="form-label">
              Number of Guests
            </label>
            <input
              className="form-control"
              id="people"
              type="number"
              name="people"
              onChange={handleChange}
              value={formData.people}
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
              onClick={() => history.goBack()}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}