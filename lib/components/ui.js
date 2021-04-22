import React from 'react'
import { useState } from 'react'

import { Link } from "react-router-dom";

import { toast } from 'react-toastify';

function Status(props) {

  const status = (props.device) ? props.device.status() : 'offline'

  return (
    <div className="device">
      <span className="device-status" data-status={ status }></span>
      Line {status}
    </div>
  )

}

function Error(message) {

  var error_block = (<div className='error-toast'>
    <em className="fa fa-exclamation-triangle fa-3x" />
    <span>{message}</span>
  </div>)

  toast.error(error_block, { autoClose: 4000, containerId: 'lcn-twilio-caller' })

}

function setAvailability(available, props) {

  if(available) {
    axios.post(this.props.availabilityEndpoint)
    props.setupDevice(props.token)
    this.props.updateAvailability(true)
  } else {
    axios.post(this.props.availabilityEndpoint)
    this.props.updateAvailability(false)
    props.destroyDevice()
  }

}

function StatusControl(props) {

  return (

    <div className="caller-availability">

      { props.device &&
        <a
          onClick={ e => { setAvailability(false, props) }}
          className="available-switch available">
            <em className="fa fa-phone"/>
            <span>Available</span>
          </a>
        }

        { !props.device &&
         <a
           onClick={ e => { setAvailability(true, props) }}
           className="available-switch unavailable">
            <em className="fa fa-phone-slash"/>
            <span>Unavailable</span>
           </a>
         }

    </div>

  )
}

function Actions(props) {

  var enquiry_close = null
  var enquiry_capture = null

  if(props.enquiryId) {

    if(!props.connection || props.connection.status()=="closed") {
      enquiry_close = (
        <a
          className="caller_action"
          onClick={() => props.resetDevice() }>
          <em className="fa fa-times-circle" />
          Close
        </a>
      )
    }

    if(props.answered && props.enquiryId) {
      enquiry_capture = (
        <Link
          className="caller_action"
          to={"/tools/triage/enquiries/app/open/"+props.enquiryId+"/details"}>
          <em className="fad fa-book" />
          Add summary (#{ props.enquiryId })
        </Link>
      )
    } else if(props.enquiryId) {
      enquiry_capture = (
        <Link
          className="caller_action"
          to={"/tools/triage/enquiries/app/open/"+props.enquiryId}>
          <em className="fad fa-book" />
          View enquiry (#{ props.enquiryId })
        </Link>
      )
    }

    return (
      <div className="caller_completed_actions">
        { enquiry_capture }
        { enquiry_close }
      </div>
    )

  }
}

export { Status, StatusControl, Error, Actions }
