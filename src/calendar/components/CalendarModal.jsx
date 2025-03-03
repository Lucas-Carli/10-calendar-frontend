import { useEffect, useMemo, useState } from 'react';
import { addHours, differenceInSeconds } from 'date-fns';

import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

import Modal from 'react-modal';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// import { es } from 'date-fns/locale/es';

// registerLocale('es', es)
import { useCalendarStore, useUiStore } from '../../hooks';
import { getEnvVariables } from '../../helpers';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
    },
};

if (getEnvVariables().VITE_MODE !== 'test') {
    Modal.setAppElement('#root');
}

export const CalendarModal = () => {

    const { isDateModalOpen, closeDateModal } = useUiStore();
    const { activeEvent, startSavingEvent } = useCalendarStore();

    const [formSubmitted, setFormSubmitted] = useState(false);

    const [formValues, setFormValues] = useState({
        title: '',
        notes: '',
        start: new Date(),
        end: addHours(new Date(), 2),
    });


    const titleClass = useMemo(() => {
        if (!formSubmitted) return '';

        return (formValues.title.length > 0)
            ? ''
            : 'is-invalid';


    }, [formValues.title, formSubmitted])

    useEffect(() => {
        if (activeEvent !== null) {
            setFormValues({ ...activeEvent });
        }

    }, [activeEvent])


    const onInputChanged = ({ target }) => {
        setFormValues({
            ...formValues,
            [target.name]: target.value
        })
    }

    const onDateChanged = (event, changing) => {
        setFormValues({
            ...formValues,
            [changing]: event
        })
    }

    const onCloseModal = () => {
        closeDateModal();
    }

    const onSubmit = async (event) => {
        event.preventDefault();
        setFormSubmitted(true);

        const difference = differenceInSeconds(formValues.end, formValues.start);
        // console.log({difference})

        if (isNaN(difference) || difference <= 0) {
            Swal.fire('Incorrect dates', 'Verify dates entered', 'error');
            return;
        }

        if (formValues.title.length <= 0) return;

        console.log(formValues);

        // TODO:
        await startSavingEvent(formValues);
        closeDateModal();

    }



    return (
        <Modal
            isOpen={isDateModalOpen}
            onRequestClose={onCloseModal}
            style={customStyles}
            className="modal"
            overlayClassName="modal-fondo"
            closeTimeoutMS={200}
        >
            <h1> New Event </h1>
            <hr />
            <form className="container" onSubmit={onSubmit}>

                <div className="form-group mb-2">
                    <label>Date and start time</label>
                    {/* <div> */}
                    <DatePicker
                        selected={formValues.start}
                        onChange={(event) => onDateChanged(event, 'start')}
                        className="form-control"
                        dateFormat="Pp"
                        showTimeSelect
                    // locale="es"
                    // timeCaption="Hora"
                    />
                    {/* </div> */}
                </div>

                <div className="form-group mb-2">
                    <label>Date and end time</label>
                    {/* <div> */}
                    <DatePicker
                        minDate={formValues.start} // Validation
                        selected={formValues.end}
                        onChange={(event) => onDateChanged(event, 'end')}
                        className="form-control"
                        dateFormat="Pp"
                        showTimeSelect
                    // locale="es"
                    // timeCaption="Hora"
                    />
                    {/* </div> */}
                </div>

                <hr />
                <div className="form-group mb-2">
                    <label>Title and notes</label>
                    <input
                        type="text"
                        className={`form-control ${titleClass}`}
                        placeholder="Event title"
                        name="title"
                        autoComplete="off"
                        value={formValues.title}
                        onChange={onInputChanged}
                    />
                    <small id="emailHelp" className="form-text text-muted">An short description</small>
                </div>

                <div className="form-group mb-2">
                    <textarea
                        type="text"
                        className="form-control"
                        placeholder="Notes"
                        rows="5"
                        name="notes"
                        value={formValues.notes}
                        onChange={onInputChanged}
                    ></textarea>
                    <small id="emailHelp" className="form-text text-muted">More Information</small>
                </div>

                <button
                    type="submit"
                    className="btn btn-outline-primary btn-block"
                >
                    <i className="far fa-save"></i>
                    <span> Save</span>
                </button>

            </form>
        </Modal>
    )
}




