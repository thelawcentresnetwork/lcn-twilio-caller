import React from 'react'

function Caller(props) {

  return (

    <div className="connection">

      <ul className="connection-info">
        { props.contactName &&
          <li className="name">{ props.contactName }</li>
        }
        { props.connectionNumber &&
          <li className="number">{ props.connectionNumber }</li>
        }

        { props.connectionStatusText &&
          <li className="status_text">{ props.connectionStatusText }</li>
        }
      </ul>

      <form className="form" style={ { display: "none" }}>
        <input id="digits" className="form-control" type="text" placeholder="Digits to send (keypad)" />
        <a className="btn btn--outline ml-2" onClick={ () => props.sendDigits() }>
          Send
        </a>
      </form>

      { props.connection &&

        <ul className="connection-actions">
          { props.connection.status() == 'pending' &&
            <li
              data-action="answer"
              className="btn fa fa-phone mr-3"
              onClick={() => props.acceptConnection()}>
              Answer
            </li>
          }
          { props.connection.status() == 'pending' &&
            <li
              data-action="reject"
              className="btn fa fa-phone-slash btn--danger"
              onClick={() => props.rejectConnection()}>
              Ignore
            </li>
          }
          { props.connection.status() == 'ringing' || props.connection.status() == 'open' &&
            <li
              data-action="hangup"
              className="btn fa fa-phone-slash btn--danger"
              onClick={() => props.disconnectConnection()}>
              Hang up
            </li>
          }
          { (props.connection.status() == 'open' && !props.connection.isMuted()) &&
            <li
              data-action="mute"
              className="btn fa fa-microphone-slash btn--inverse ml-3"
              onClick={() => props.muteConnection()}>
              Mute Mic
            </li>
          }
          { (props.connection.isMuted()) &&
            <li
              data-action="unmute"
              className="btn fa fa-microphone ml-3"
              onClick={() => props.unMuteConnection()}>
              Unmute Mic
            </li>
          }
        </ul>

      }

    </div>

  )

}

export { Caller }
