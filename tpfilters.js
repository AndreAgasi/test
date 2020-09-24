import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import {
  Grid,
  FormControlLabel,
  FormGroup,
  Typography,
  Radio,
  RadioGroup,
  FormHelperText
} from '@material-ui/core'
import Select, { components } from 'react-select'
import DatePicker from 'react-datepicker'
import Datetime from 'react-datetime'
import moment from 'moment'

import { workingShifts } from '../../../../constants/constant'

const TpFilters = props => {
  const { data } = props

  const [selection, setSelection] = useState('shift')

  const [_date, _setDate] = useState({
    startTime: '',
    endTime: '',
    error: '',
    errorText: '',
    errorIn: ''
  })

  useEffect(() => {
    if (data.timeBasedInfo === '') {
      _setDate({
        startTime: '',
        endTime: '',
        error: '',
        errorText: '',
        errorIn: ''
      })
    }
  }, [data.timeBasedInfo])

  const onSelectionChanged = event => {
    setSelection(event.target.value)
  }
  useEffect(() => {
    if (selection !== '') {
      props.filterSelectedMode(selection)
    }
  }, [])
  useEffect(() => {
    props.filterSelectedMode(selection)
  }, [selection])

  useEffect(() => {
    if (
      _date.startTime !== '' &&
      _date.endTime !== '' &&
      _date.error === false
    ) {
      props.filteredtimeBased(_date)
    }
  }, [_date])

  const onHandleTimeOption = (date, selected) => {
    const currentDate = moment(date)

    if (selected === 'startDate') {
      _setDate({
        ..._date,
        startTime: currentDate,
        error: dateValidator(currentDate, 'startDate'),
        errorIn: dateValidator(currentDate, 'startDate') ? 'startDate' : '',
        errorText: dateValidator(currentDate, 'startDate')
          ? 'Please verify start date'
          : ''
      })
    } else if (selected === 'endDate') {
      _setDate({
        ..._date,
        endTime: currentDate,
        error: dateValidator(currentDate, 'endDate'),
        errorIn: dateValidator(currentDate, 'endDate') ? 'endDate' : '',
        errorText: dateValidator(currentDate, 'endDate')
          ? 'Please verfiy end date'
          : ''
      })
    }
  }

  const dateValidator = (currentDate, dateType) => {
    const { startTime, endTime } = _date
    let isValid = false
    if (dateType === 'startDate' && endTime) {
      isValid = currentDate.isAfter(endTime)
    } else if (dateType === 'endDate' && startTime) {
      isValid = currentDate.isBefore(startTime)
    }
    return isValid
  }

  return (
    <React.Fragment>
      <Grid container>
        <Grid item container xs>
          <RadioGroup
            row
            aria-label="selection"
            name="selection"
            defaultValue={selection}
            onChange={onSelectionChanged}
          >
            <FormControlLabel
              value="shift"
              control={<Radio color="primary" />}
              label="Shift Based"
              labelPlacement="right"
            />
            <FormControlLabel
              value="time"
              control={<Radio color="primary" />}
              label="Time Based"
              labelPlacement="right"
            />
          </RadioGroup>
        </Grid>
      </Grid>
      <Grid container>
        <Grid item xs container>
          <FormGroup row style={{ alignItems: 'end' }}>
            <FormControlLabel
              control={
                <Select
                  className="select-container"
                  options={data.locationList}
                  onChange={props.filteredLocations}
                  value={data.selectedLocation}
                  styles={{
                    menuPortal: base => ({
                      ...base,
                      zIndex: 9999
                    })
                  }}
                  menuPortalTarget={document.body}
                />
              }
              label={<Typography>Select Line</Typography>}
              labelPlacement="top"
            />
            <FormControlLabel
              control={
                <Select
                  className="select-container"
                  options={data.filteredMachines}
                  onChange={props.filteredMachines}
                  value={data.selectedMachine}
                  styles={{
                    menuPortal: base => ({
                      ...base,
                      zIndex: 9999
                    })
                  }}
                  menuPortalTarget={document.body}
                />
              }
              label={<Typography>Select Machine</Typography>}
              labelPlacement="top"
            />
            {selection && selection === 'shift' ? (
              <React.Fragment>
                <FormControlLabel
                  control={
                    <DatePicker
                      className="datepicker-custom"
                      selected={data.selectedDate}
                      onChange={props.filteredDate}
                      dateFormat="MM/dd/yyyy"
                      maxDate={new Date()}
                      popperClassName="datepicker-popper"
                      popperContainer={CalendarContainer}
                      disabled={
                        data.selectedMachine === '' ||
                        data.selectedMachine === typeof 'undefined'
                      }
                    />
                  }
                  label={<Typography>Select Date</Typography>}
                  labelPlacement="top"
                />
                <FormControlLabel
                  control={
                    <Select
                      className="select-container"
                      options={workingShifts}
                      onChange={props.filteredShift}
                      value={data.selectedShift}
                      isDisabled={
                        data.selectedDate === '' ||
                        data.selectedDate === typeof 'undefined' ||
                        data.selectedMachine === '' ||
                        data.selectedMachine === typeof 'undefined'
                      }
                      styles={{
                        menuPortal: base => ({
                          ...base,
                          zIndex: 9999
                        })
                      }}
                      menuPortalTarget={document.body}
                    />
                  }
                  label={<Typography>Select shifts</Typography>}
                  labelPlacement="top"
                />
              </React.Fragment>
            ) : (
                <React.Fragment>
                  <div className="timepicker-Wrapper">
                    <FormControlLabel
                      closeOnSelect={true}
                      disabled={data.selectedMachine === ''}
                      control={
                        <Datetime
                          inputProps={{
                            disabled: data.selectedMachine === ''
                          }}
                          timeFormat="h:mm:ss a"
                          onChange={e => onHandleTimeOption(e, 'startDate')}
                          // onBlur={e => onHandleTimeOption(e, 'startDate')}
                          value={_date.startTime ? _date.startTime : ''}
                        />
                      }
                      label={<Typography>Start Date</Typography>}
                      labelPlacement="top"
                    />
                    <FormHelperText
                      style={{
                        marginLeft: 16,
                        width: 160,
                        wordBreak: 'break-all'
                      }}
                      className="error-label"
                      error={_date.error && _date.errorIn === 'startDate'}
                    >
                      {_date.error && _date.errorIn === 'startDate'
                        ? _date.errorText
                        : ''}
                    </FormHelperText>
                  </div>
                  <div className="timepicker-Wrapper">
                    <FormControlLabel
                      disabled={data.selectedMachine === '' ||
                        _date.startTime === ''}
                      control={
                        <Datetime
                          closeOnSelect={true}
                          inputProps={{
                            disabled:
                              data.selectedMachine === '' ||
                              _date.startTime === ''
                          }}
                          timeFormat="h:mm:ss a"
                          onChange={e => onHandleTimeOption(e, 'endDate')}
                          // onBlur={e => onHandleTimeOption(e, 'endDate')}
                          value={_date.endTime ? _date.endTime : ''}
                        />
                      }
                      label={<Typography>End Date</Typography>}
                      labelPlacement="top"
                    />
                    <FormHelperText
                      style={{
                        marginLeft: 16,
                        width: 160,
                        wordBreak: 'break-all'
                      }}
                      className="error-label"
                      error={_date.error && _date.errorIn === 'endDate'}
                    >
                      {_date.error && _date.errorIn === 'endDate'
                        ? _date.errorText
                        : ''}
                    </FormHelperText>
                  </div>
                </React.Fragment>
              )}
            <FormControlLabel
              control={
                <Select
                  className="select-container"
                  options={data.programLists}
                  isMulti
                  styles={{
                    menuPortal: base => ({
                      ...base,
                      zIndex: 9999
                    })
                  }}
                  onChange={(program) => props.filterSelectedProgram(program)}
                  menuPortalTarget={document.body}
                >
                </Select>
              }
              label={<Typography>Select Program</Typography>}
              labelPlacement="top"
            />
          </FormGroup>
        </Grid>
      </Grid>
    </React.Fragment>
  )
}
export default TpFilters

/**Date popper portal to body */
const CalendarContainer = ({ children }) =>
  children
    ? ReactDOM.createPortal(
      React.cloneElement(children, {
        className: 'datepicker-custom react-datepicker-popper'
      }),
      document.body
    )
    : null
