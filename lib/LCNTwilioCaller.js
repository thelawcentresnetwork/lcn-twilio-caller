import React, { Component } from 'react'
import { toast, ToastContainer } from 'react-toastify';
import { Link } from "react-router-dom";
import axios from 'axios';

import { Actions, Status, StatusControl, Error } from './components/ui';
import { Caller } from './components/caller';
import './styles/lcn-twilio-caller.css';

const TwilioCall = require('twilio-client');

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
      capabilityEndpoint: null,
      answerEndpoint: null,
      availabilityEndpoint: null,
      available: true
    };

  }

  componentDidMount() {

    if(this.props.capabilityEndpoint) {

      this.setState({
        available: this.props.available,
        capabilityEndpoint: this.props.capabilityEndpoint,
        answerEndpoint: this.props.answerEndpoint,
        availabilityEndpoint: this.props.availabilityEndpoint
      })

      axios.post(this.props.capabilityEndpoint)
      .then(res => {
        if(this.props.available) {
          this.setupDevice(res.data.token)
        } else {
          this.setState({ token: res.data.token })
        }
      })

    } else {

      Error("Can not activate caller.")

    }

  }

  componentDidUpdate() {

    if(this.props.available != this.state.available) {
      this.setState({ available: this.props.available })
    }

  }

  resetDevice = () => {
    this.setState({
      visible: false,
      connection: null,
      answered: false,
      connectionNumber: null,
      connectionStatusText: null,
      contactName: null,
      enquiryId: null
    })
  }

  destroyDevice = () => {

    if(this.state.device) {
      this.state.device.destroy();
      this.setState({ device: null });
      this.resetDevice();
    }

  }

  setupDevice = (token) => {

    try {

      var device = TwilioCall.Device.setup( token, {
        closeProtection: true,
        appName: "LCN Twilio Caller",
        appVerion: "0.2.0"
      });

    } catch(error) {

      Error('Error enabling caller, you will not be able to accept or make calls at this time.')
      return

    }

    this.setState({
      token: token,
      device: device
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

      Error('Error enabling caller: '+error.message)
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
        enquiryId: connection.customParameters.get('app_enquiry_id')
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

  bindConnectionEvents = (conn) => {

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
      if(this.state.answerEndpoint) {
        axios.post(this.state.answerEndpoint, {
          call: connection['parameters']['CallSid']
        });
      }

    }.bind(this));

    conn.on('cancel', function(connection) {

      this.setState({
        connectionStatusText: 'Call completed',
        connectionNumber: null,
        connection: null
      })

    }.bind(this));

  }

  dialOutgoing = (phoneNumber, enquiry, user, contactName, contact) => {

    this.state.device.connect({
      phoneNumber: phoneNumber,
      userId: user,
      enquiryId: enquiry,
      contactId: contact
    });

    this.setState({
      enquiryId: enquiry,
      contactName: contactName,
      answered: true
    })

  }

  sendDigits = () => {
    if(this.state.connection) {
      this.state.connection.sendDigits($('#digits').val());
    }
  }

  muteConnection = () => {
    if(this.state.connection) {
      this.state.connection.mute(true);
    }
  }

  unMuteConnection = () => {
    if(this.state.connection) {
      this.state.connection.mute(false);
    }
  }

  acceptConnection = () => {
    if(this.state.connection) {
      this.state.connection.accept();
    }
  }

  rejectConnection = () => {
    if(this.state.connection) {
      this.state.connection.ignore();
      this.resetDevice();
    }
  }

  disconnectConnection = () => {
    if(this.state.connection) {
      this.state.connection.disconnect();
    }
  }

  updateAvailability = (available) => {
    this.setState({available: available})
  }

  render() {

    return (

      <React.Fragment>

        <StatusControl
          updateAvailability={this.updateAvailability}
          available={ this.state.available }
          availabilityEndpoint={ this.state.availabilityEndpoint }
          device={ this.state.device }
          destroyDevice={ this.destroyDevice }
          setupDevice={ this.setupDevice }
          token={ this.state.token } />

        { this.state.device && this.state.visible &&

          <section className="caller">

            <Status device={this.state.device} />

            <Caller
              {...this.state}
              sendDigits={ this.sendDigits }
              acceptConnection={ this.acceptConnection }
              rejectConnection={ this.rejectConnection }
              disconnectConnection={ this.disconnectConnection }
              muteConnection={ this.muteConnection }
              unMuteConnection={ this.unMuteConnection }
              />

            <Actions
              {...this.state}
              resetDevice={ this.resetDevice } />

          </section>

        }

        {
          React.cloneElement(this.props.children, {
            dialOutgoing: this.dialOutgoing,
            caller: this.state.device
          })
        }

        <ToastContainer
          enableMultiContainer
          containerId={'lcn-twilio-caller'}
          position={toast.POSITION.TOP_CENTER} />

      </React.Fragment>
    )
  }

}

export default LCNTwilioCaller;
