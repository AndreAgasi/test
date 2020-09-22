import React, { Component, Fragment } from 'react'
import ReactResizeDetector from 'react-resize-detector'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import moment from 'moment'
import Switch from "@material-ui/core/Switch";
import { withStyles } from "@material-ui/core/styles";

import Highcharts, { Point } from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official'
import { sandSignika } from '../../../common/EMChartThemes'

import {
  Grid,
  Button,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  FormControlLabel
} from '@material-ui/core'

import {
  snackBarFunction,
  snackBarTypes
} from '../../../../actions/snackBarActions'
import AddTitle from '../../components/AddTitle'
import {
  mapMachines,
  formatProgramNames
} from '../../../../selectors/dashboard/fpyChartSelectors'
import {
  fetchChannels,
  fetchPrograms,
  fetchGraphData,
  // addChartData,
  fetchRoomAndMachine
} from '../../../../actions/Throughput/TpChart.actions'

import Chart from './Chart'
import './tpstyles.css'
import TpFilters from './TpFilters'

class TpComponent extends Component {
  constructor(props) {
    super(props)
    this.state = this.setInitialState(props)
  }
  /**setting intial data use or modify when props updates
   * return object
   */
  setInitialState = props => {
    const {
      tpMachineFetchLocationId,
      tpChartData,
      chartType,
      tpGroupID
    } = props
    let defaultState = {
      chartSize: {},
      machineListed: [],
      programLists: [],
      selectedLocation: '',
      selectedMachine: '',
      selectedDate: '',
      selectedProgram: [],
      selectedShift: '',
      selectedTime: '',
      chartTitle: 'Add Title',
      selectedChannel: '',
      timeStampSelectDate: '',
      timeStampSelectTime: '',
      isfilterModalOpen: false,
      isDataFetching: false,
      timeBasedInfo: '',
      groupId: tpGroupID,
      currentTimeInfo: '',
      isLiveToggled: false,
      channelInfo: [],
      locationList: [],
      machineList: [],
      filteredMachines: [],
      chartType: 'column',
      chartData: { categories: [], seriesData: [], infobar: '' }
    }
    return defaultState
  }

  fetchRoomAndMachineList = async () => {
    const { fetchRoomAndMachine } = this.props.actions
    await fetchRoomAndMachine()
  }

  loadIntialData = () => {
    this.fetchRoomAndMachineList()
    this.onSaveChartDetails()
  }

  componentDidMount() {
    this.loadIntialData()
  }

  /**Graph header sections Start */
  onDateSelect = date => {
    this.setState(
      {
        selectedDate: date,
        // chartData: { categories: [], seriesData: [], infobar: '' },
        selectedShift: '',
        selectedTime: '',
        selectedProgram: []
      },
      () => {
        this.onSaveChartDetails()
      }
    )
  }

  onMachineSelect = async machine => {
    const { fetchChannels } = this.props.actions
    const channel = await fetchChannels(machine.value)
    const channelId = channel.length > 0 ? channel[0].id : 0
    this.setState(
      {
        selectedMachine: machine,
        selectedChannel: channelId,
        channelInfo: channel,
        selectedShift: '',
        selectedTime: '',
        selectedProgram: [],
        selectedDate: '',
        //chartData: { categories: [], seriesData: [], infobar: '' },
      },
      () => {
        this.onSaveChartDetails()
      }
    )
  }

  onShiftsSelect = shift => {
    this.setState({ selectedShift: shift, selectedProgram: [] }, () => {
      this.getPrograms()
      this.onSaveChartDetails()
    })
  }

  onProgramsSelect = program => {
    if (program === null) program = ''
    this.setState({ selectedProgram: program }, () => {
      this.onSaveChartDetails()
    })
  }

  handleGetChartData = () => {
    this.onFilterClose()
    setTimeout(() => {
      this._fetchGraphData()
    })
  }

  titleChanges = title => {
    this.setState({ chartTitle: title }, () => {
      this.onSaveChartDetails()
    })
  }

  onChartResize(size, id) {
    const element = document.getElementById(`tpChart-${id}`)
    if (element) {
      const { offsetHeight, offsetWidth } = element
      this.setState({
        chartSize: {
          resizedHeight: offsetHeight - 50,
          resizedWidth: offsetWidth - 8
        }
      })
    }
  }

  onHandleTimeBases = timeInfo => {
    this.setState({ timeBasedInfo: timeInfo, selectedProgram: '' }, () => {
      this.onSaveChartDetails()
      this.getPrograms(false)
    })
  }

  onFilterOpen = () => {
    this.setState({
      isfilterModalOpen: true,
      selectedLocation: '',
      selectedMachine: '',
      selectedChannel: '',
      channelInfo: '',
      selectedShift: '',
      selectedTime: '',
      selectedProgram: [],
      selectedDate: '',
    }, () => {
      this.onSaveChartDetails()
    })
  }

  onFilterClose = () => {
    this.setState({ isfilterModalOpen: false }, () => {
      this.onSaveChartDetails()
    })
  }

  handleSelectedMode = mode => {
    if (mode === 'shift') {
      this.setState({
        timeBasedInfo: ''
      })
    } else if (mode === 'time') {
      this.setState({
        selectedShift: ''
      })
    }
  }

  /**Graph header sections Ends */

  /**default action to save when updation */
  onSaveChartDetails = () => {
    const { id, onAddTpData } = this.props
    onAddTpData(id, this.state)
  }
  /** creating url given data
   * condtion checks
   * isTime skipped or not
   * date modify 22-06 (current day-next day)
   * returns url string
   */
  makeFetchParms = (isShiftBased = true) => {
    const {
      selectedDate,
      selectedMachine: { label },
      selectedShift: { value },
      selectedLocation: { value: id },
      selectedChannel,
      timeBasedInfo
    } = this.state

    let startDate = null
    let endDate = null
    if (timeBasedInfo === '' && typeof value !== 'undefined') {
      const arrayShift = value.split('-')
      startDate = moment(selectedDate).set({
        hour: arrayShift[0],
        minute: 0,
        second: 0
      })
      endDate = moment(selectedDate).set({
        hour: arrayShift[1],
        minute: 0,
        second: 0
      })

      if (parseInt(arrayShift[0]) > parseInt(arrayShift[1])) {
        endDate = moment(selectedDate)
          .set({
            hour: arrayShift[1],
            minute: 0,
            second: 0
          })
          .add(1, 'days')
      }
    } else {
      const { startTime, endTime } = timeBasedInfo
      startDate = moment(startTime)
      endDate = moment(endTime)
    }

    const toFetch = {
      serialNumber: label,
      channelId: selectedChannel,
      locationId: id,
      startTime: parseInt(startDate.format('x')),
      endTime: parseInt(endDate.format('x'))
    }
    const makeUrl = Object.keys(toFetch)
      .map(url => {
        return `${url}=${toFetch[url]}`
      })
      .join('&')
    return makeUrl
  }
  /**Fetching programs list to plot graph using makefetch function for creating url */
  getPrograms = async (isShiftBased = true) => {
    const { fetchPrograms } = this.props.actions

    const programUrl = this.makeFetchParms(isShiftBased)
    const programResponse = await fetchPrograms(programUrl)

    const programLists = this.makePogramNames(programResponse)

    this.setState(
      {
        programLists,
        selectedProgram: [],
        //chartData: { categories: [], seriesData: [], infobar: '' },
      },
      () => {
        this.onSaveChartDetails()
      }
    )
  }

  handleLiveToggleChange = (event) => {
    if (event.target.checked) {
      this.startCountDown()
    }
    else {
      this.stopCountDown()
    }

  };

  timer = () => {
    this.interval = setInterval(() => {
      this._fetchGraphData()
    }, 20000)
  }

  startCountDown = () => {
    this.timer();
  }

  stopCountDown = () => {
    clearInterval(this.interval)
  }

  _fetchGraphData = async () => {
    const { selectedProgram } = this.state
    const { fetchGraphData } = this.props.actions

    if (selectedProgram && selectedProgram.length) {
      const isAllexits = selectedProgram.find(e => e.value === 'All')
      const programName = selectedProgram.map(e => e.value);
      const params = this.makeFetchParms()
      const urlData = {
        url: `data?${params}`,
        isAllSelected: !!isAllexits,
        programName
      }
      const chartData = await fetchGraphData(urlData);
      this.setState({ chartData })
    }
  }

  makeLocationList = (roomMachineList) => {
    const locations = roomMachineList.map(room => ({
      label: room.name,
      value: room.id
    }))
    return locations
  }

  makeMachineList = (roomMachineList) => {
    const machines = []
    roomMachineList.forEach(room => {
      room.machines.forEach(machine => {
        machines.push({
          ...machine,
          label: machine.serialNumber,
          value: machine.id
        })
      })
    })
    return machines
  }

  makePogramNames = (data = []) => {
    const defaultOption = [{
      label: 'All',
      value: 'All',
      key: 0
    }]

    const _programList = data.map((program, index) => ({
      label: program,
      value: program,
      key: index + 1
    }))

    if (_programList.length) {
      return [...defaultOption, ..._programList]
    } else {
      return []
    }
  }

  onLocationSelect = async location => {
    const { machineList } = this.state

    const filteredMachines = machineList.filter(machine => machine.locationId === location.value)
    this.setState(
      {
        selectedLocation: location,
        filteredMachines,
        selectedChannel: '',
        selectedMachine: '',
        channelInfo: '',
        selectedShift: '',
        selectedTime: '',
        selectedProgram: [],
        selectedDate: '',
        //chartData: { categories: [], seriesData: [], infobar: '' },
      },
      () => {
        this.onSaveChartDetails()
      }
    )
  }

  UNSAFE_componentWillReceiveProps(currentProps) {
    const { locationList, machineList } = this.state

    const { roomMachineLists } = currentProps

    const locationListTp = roomMachineLists && roomMachineLists.length
      ? this.makeLocationList(roomMachineLists)
      : locationList

    const machineListTp = roomMachineLists && roomMachineLists.length
      ? this.makeMachineList(roomMachineLists)
      : machineList

    this.setState({
      locationList: locationListTp,
      machineList: machineListTp
    })
  }

  render() {
    const {
      removeTpChart,
      id,
      isEditable,
      tpChartClear,
      tpChartClearToggle,
      isLiveToggled,
    } = this.props

    const {
      chartSize,
      selectedProgram,
      chartType,
      chartData,
      chartTitle,
      isfilterModalOpen,
    } = this.state

    let chartLoadingStatus = false

    return (
      <div
        className="flx_cl"
        id={id}
        style={{
          height: '100%',
          width: '100%',
          borderRadius: 6,
          backgroundColor: 'rgb(30,30,32)',
          padding: 8
        }}
        draggable
        id={`tpChart-${id}`}
      >
        <Grid container alignItems="center" justify="center">
          <Grid item xs>
            {isEditable && (
              <i
                className="fa fa-filter filter-icon"
                aria-hidden="true"
                onClick={this.onFilterOpen}
              ></i>
            )}
          </Grid>
          <Grid item xs container justify="space-evenly">
            <AddTitle onChange={e => this.titleChanges(e)} title={chartTitle} />
              <FormControlLabel
                control={<Switch checked={isLiveToggled} onChange={this.handleLiveToggleChange} name="checkedA" />}
                label={<Typography className="font8" style={{ color: "white" }}>
                  Live
      </Typography>}
                labelPlacement="end"
              />
          </Grid>
          <Grid item xs container justify="flex-end">
            {isEditable && (
              <button
                type="button"
                className="flt_rt"
                onClick={() => removeTpChart(id)}
              >
                <i className="fa fa-times-circle" aria-hidden="true" />
              </button>
            )}
          </Grid>
          <Dialog
            fullWidth={true}
            maxWidth="lg"
            open={isfilterModalOpen}
            id={`dialog-${id}`}
          >
            <DialogTitle>
              <Typography>TP filters</Typography>
            </DialogTitle>
            <DialogContent>
              <TpFilters
                data={this.state}
                filteredLocations={this.onLocationSelect}
                filteredMachines={this.onMachineSelect}
                filteredDate={this.onDateSelect}
                filteredShift={this.onShiftsSelect}
                filteredtimeBased={this.onHandleTimeBases}
                filterSelectedProgram={this.onProgramsSelect}
                filterSelectedMode={this.handleSelectedMode}
              />
              <DialogActions>
                <Button
                  onClick={this.handleGetChartData}
                  disabled={
                    selectedProgram === '' ||
                    selectedProgram.length === 0 ||
                    typeof selectedProgram === 'undefined'
                  }
                >
                  Apply
                </Button>
                <Button onClick={this.onFilterClose} color="primary">
                  Close
                </Button>
              </DialogActions>
            </DialogContent>
          </Dialog>
        </Grid>
        <Grid
          container
          item
          xs={12}
          justify="space-around"
          alignItems="center"
          alignContent="center"
        >
          <ReactResizeDetector
            handleWidth
            handleHeight
            onResize={e => this.onChartResize(e, id)}
          >
            {chartLoadingStatus && (
              <CircularProgress
                size={60}
                className="chart-loader"
                color="secondary"
              />
            )}

            <Chart
              dimensions={chartSize}
              chartType={'column'}
              chartData={chartData}
              tpChartClear={tpChartClear}
              tpChartClearToggle={() => tpChartClearToggle()}
            />
          </ReactResizeDetector>
        </Grid>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    roomMachineLists: state.tpChartConfigurationReducer.roomMachineList,
  }
}
function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(
      {
        fetchRoomAndMachine,
        fetchChannels,
        fetchPrograms,
        fetchGraphData,
        snackBarFunction
      },
      dispatch
    )
  }
}

TpComponent.propTypes = {
  TpComponentResize: PropTypes.func,
  removeTpComponent: PropTypes.func,
  onAddTpComponentData: PropTypes.func
}

export default connect(mapStateToProps, mapDispatchToProps)(TpComponent)
