import React, { Component } from 'react'
import { ToastContainer, toast } from 'react-toastify';
import { Link } from "react-router-dom";
import { DropdownButton, Dropdown } from 'react-bootstrap';
import axios from 'axios';

const TwilioCall = require('twilio-client');

function StatusDisplay(props) {

  const status = (props.device) ? props.device.status() : 'offline'

  return (
    <div className="device">
      <span className="device-status" data-status={ status }></span>
      Line {status}
    </div>
  )

}

class LCNTwilioCaller extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      token: null,
      device: null,
      connection: null,
      visible: false,
      answered: false,
      connectionNumber: null,
      connectionStatusText: null,
      contactName: null,
      enquiryId: null,
      enquiryState: null
    };

    axios.post("/twilio/capability")
    .then(res => {
      this.setupDevice(res.data.token)
    })

  }

  resetDevice() {
    this.setState({
      visible: false,
      connection: null,
      answered: false,
      connectionNumber: null,
      connectionStatusText: null,
      contactName: null,
      enquiryId: null,
      enquiryState: null
    })
  }

  destroyDevice() {

    if(this.state.device) {
      this.state.device.destroy();
      this.setState({ device: null });
      this.resetDevice();
    }

  }

  setupDevice(token) {

    try {

      var device = TwilioCall.Device.setup( token, {
        closeProtection: true,
        appName: "LCN Twilio Caller",
        appVerion: "0.2.2-mvp"
      });

    } catch(error) {

      console.log(error)
      this.displayError('Error enabling caller, you will not be able to accept or make voice calls at this time.')
      return

    }

    this.setState({
      token: token,
      device: device,
    })

    device.on('ready', function (device) {

      this.setState({
        device: device,
        connectionNumber: null,
        connectionStatusText: null
      })

    }.bind(this));

    device.on('offline', function (device) {

      this.resetDevice();

    }.bind(this));

    device.on('error', function (error) {

      this.displayError('Error enabling caller: '+error.message)
      this.resetDevice();

    }.bind(this));

    device.on('connect', function (connection) {

      if ("phoneNumber" in connection.message) {
        var number = connection.message.phoneNumber
      } else {
        var number = connection['parameters']['From']
      }

      this.setState({
        connectionStatusText: "Active call",
        connectionNumber: number,
        connection: connection,
        visible: true
      })

      this.bindConnectionEvents(connection)

    }.bind(this));

    device.on('incoming', function(connection) {

      if(TwilioCall.Device.connections.length>1) {
        connection.ignore();
        return;
      }

      this.setState({
        visible: true,
        answered: false,
        connectionStatusText: "Incoming call...",
        connectionNumber: connection['parameters']['From'],
        connection: connection,
        contactName: connection.customParameters.get('app_contact_name'),
        enquiryId: connection.customParameters.get('app_enquiry_id'),
        enquiryState: connection.customParameters.get('app_enquiry_state')
      })

      this.bindConnectionEvents(connection)

    }.bind(this));

    device.on('disconnect', function(connection) {

      this.setState({
        connectionStatusText: 'Call completed',
        connectionNumber: null,
        connection: null
      })

    }.bind(this));

  }

  bindConnectionEvents(conn) {

    conn.on('mute', function(isMuted, connection) {

      this.setState({
        connection: connection
      })

    }.bind(this));

    conn.on('accept', function(connection) {

      this.setState({
        connection: connection,
        answered: true,
        connectionStatusText: "Connecting...",
        connectionNumber: connection['parameters']['From']
      })

      // Log who answered this call
      // on our app in the background

      $.post("/twilio/calls/answer", {
        authenticity_token: $('[name="csrf-token"]')[0].content,
        call: connection['parameters']['CallSid']
      }, function(data) {
      });

    }.bind(this));

    conn.on('cancel', function(connection) {

      this.setState({
        connectionStatusText: 'Call completed',
        connectionNumber: null,
        connection: null
      })

    }.bind(this));

  }

  dialOutgoing = (phoneNumber, enquiry, user, contact) => {

    this.state.device.connect({
      phoneNumber: phoneNumber,
      userId: user,
      enquiryId: enquiry
    });

    this.setState({
      enquiryId: enquiry,
      contactName: contact,
      answered: true
    })

  }

  sendDigits() {
    if(this.state.connection) {
      this.state.connection.sendDigits($('#digits').val());
    }
  }

  muteConnection() {
    if(this.state.connection) {
      this.state.connection.mute(true);
    }
  }

  unMuteConnection() {
    if(this.state.connection) {
      this.state.connection.mute(false);
    }
  }

  acceptConnection() {
    if(this.state.connection) {
      this.state.connection.accept();
    }
  }

  rejectConnection() {
    if(this.state.connection) {
      this.state.connection.ignore();
      this.resetDevice();
    }
  }

  disconnectConnection() {
    if(this.state.connection) {
      this.state.connection.disconnect();
    }
  }

  displayError(message) {
    var error_block = (<div className='d-flex'>
      <em className="fa fa-exclamation-triangle pr-3 fa-3x pt-1" />
      <span>{message}</span>
    </div>)
    toast.error(error_block, { autoClose: 4000, position: "top-center" })
  }

  render() {

    var enquiry_action = null

    if(this.state.enquiryId) {

      var enquiry_close = null
      if(!this.state.connection || this.state.connection.status()=="closed") {
        enquiry_close = (
          <a
            className="caller_action"
            onClick={() => this.resetDevice() }>
            <em className="fa fa-times-circle" />
            Close
          </a>
        )
      }

      var enquiry_capture = null
      if(this.state.answered) {
        enquiry_capture = (
          <Link
            className="caller_action"
            to={"/tools/triage/enquiries/app/open/"+this.state.enquiryId+"/details"}>
            <em className="fad fa-book" />
            Add summary (#{ this.state.enquiryId })
          </Link>
        )
      } else {
        enquiry_capture = (
          <Link
            className="caller_action"
            to={"/tools/triage/enquiries/app/open/"+this.state.enquiryId}>
            <em className="fad fa-book" />
            View enquiry (#{ this.state.enquiryId })
          </Link>
        )
      }

      enquiry_action = (
        <div className="caller_completed_actions">
          { enquiry_capture }
          { enquiry_close }
        </div>
      )

    }

    if(this.state.device) {
      var toggle = (
        <Dropdown.Item
          onClick={ e => { this.destroyDevice() }}>
          <em className="fal fa-phone-slash pr-2 unavailable" />
          Not available
        </Dropdown.Item>
      )
    } else {
      var toggle = (
        <Dropdown.Item
          onClick={ e => { this.setupDevice(this.state.token) }}>
          <em className="fal fa-phone-volume pr-2 available" />
          Available
        </Dropdown.Item>
      )
    }

    var status_toggle = (
      <div className="caller-availability">
        <Dropdown>
          <Dropdown.Toggle id="available-checker" variant="link">
            { this.state.device &&
              <span>
                <em className="fa fa-phone-volume available"/>
                Available
              </span>
            }
            { !this.state.device &&
              <span>
                <em className="fa fa-phone-slash unavailable"/>
                Not available
              </span>
            }
          </Dropdown.Toggle>
          <Dropdown.Menu>
            { toggle }
          </Dropdown.Menu>
        </Dropdown>
      </div>
    )

    var caller = null
    if(this.state.device && this.state.visible) {
      caller = (
        <section className="caller">

          <StatusDisplay device={this.state.device} />

          <div className="connection">

            <ul className="connection-info">
              { this.state.contactName &&
                <li className="name">{ this.state.contactName }</li>
              }
              { this.state.connectionNumber &&
                <li className="number">{ this.state.connectionNumber }</li>
              }
              { this.state.connectionStatusText &&
                <li className="status_text">{ this.state.connectionStatusText }</li>
              }
            </ul>

            <form className="form" style={ { display: "none" }}>
              <input id="digits" className="form-control" type="text" placeholder="Digits to send (keypad)" />
              <a className="btn btn--outline ml-2" onClick={ () => this.sendDigits() }>
                Send
              </a>
            </form>

            { this.state.connection &&

              <ul className="connection-actions">
                { this.state.connection.status() == 'pending' &&
                  <li
                    data-action="answer"
                    className="btn fa fa-phone mr-3"
                    onClick={() => this.acceptConnection()}>
                    Answer
                  </li>
                }
                { this.state.connection.status() == 'pending' &&
                  <li
                    data-action="reject"
                    className="btn fa fa-phone-slash btn--danger"
                    onClick={() => this.rejectConnection()}>
                    Ignore
                  </li>
                }
                { this.state.connection.status() == 'ringing' || this.state.connection.status() == 'open' &&
                  <li
                    data-action="hangup"
                    className="btn fa fa-phone-slash btn--danger"
                    onClick={() => this.disconnectConnection()}>
                    Hang up
                  </li>
                }
                { (this.state.connection.status() == 'open' && !this.state.connection.isMuted()) &&
                  <li
                    data-action="mute"
                    className="btn fa fa-microphone-slash btn--inverse ml-3"
                    onClick={() => this.muteConnection()}>
                    Mute Mic
                  </li>
                }
                { (this.state.connection.isMuted()) &&
                  <li
                    data-action="unmute"
                    className="btn fa fa-microphone ml-3"
                    onClick={() => this.unMuteConnection()}>
                    Unmute Mic
                  </li>
                }
              </ul>

            }

            { enquiry_action }

          </div>

        </section>
      )
    }

    return (

      <React.Fragment>

        { status_toggle }
        { caller }

        {
          React.cloneElement(this.props.children, {
            dialOutgoing: this.dialOutgoing,
            caller: this.state.device
          })
        }

      </React.Fragment>
    )
  }

}

export default LCNTwilioCaller;
