# LCN Twilio Caller

React component to set availability, receive and place voice calls in the browser using Twilio.

```
npm install lcn-twilio-caller
```

![LCN Twilio Caller](https://raw.githubusercontent.com/thelawcentresnetwork/lcn-twilio-caller/main/demo/lcn-twilio-caller.gif)

## Browser Support

See more about supported browsers and client requirements in the [Twilio Docs](https://www.twilio.com/docs/voice/client/javascript#supported-browsers).

## Setup

Twilio requires your app to generate a capability token before use, our component makes a POST request to `capabilityEndpoint` and expects a token back.

As an example, in Ruby:

```
def generate_capability
  agent = 'name-of-your-agent'

  capability = Twilio::JWT::ClientCapability.new(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, ttl: 86_400)

  outgoing_scope = Twilio::JWT::ClientCapability::OutgoingClientScope.new(TWILIO_CALL_TWIML_APP, agent)
  capability.add_scope outgoing_scope

  incoming_scope = Twilio::JWT::ClientCapability::IncomingClientScope.new(agent)
  capability.add_scope incoming_scope

  render json: { token: capability.to_s }
end
```

More details of backend requirements can be found in the [Twilio Client SDK](https://www.twilio.com/docs/voice/client/javascript) documentation.

### Locally logging who answers a call

A POST request will also be made to `answerEndpoint` when a call is answered if you wish to log who answered a call in your application.

As an example, in Ruby:

```
def answer
  twilio_client = Twilio::REST::Client.new
  twilio_call = twilio_client.calls(params[:call]).fetch

  call = Call.find_by_twilio_id(twilio_call.parent_call_sid)
  call.update({
    user: current_user,
    twilio_status: twilio_call.status
  })  
end
```

## Usage

Wrap your React app in the `LCNTwilioCaller` component then use `this.props.dialOutgoing` to make calls. dialOutgoing accepts a number of parameters if you wish to pass the call or contact IDs and names between the caller and Twilio, otherwise these can be left blank.

Incoming calls will automatically ring if the user has set themselves available.

```
import LCNTwilioCaller from 'lcn-twilio-caller';

<LCNTwilioCaller
  capabilityEndpoint={'/caller/capability'}
  answerEndpoint={'/caller/answer'}>

  <App />

  <a
    href="tel:4400"
    onClick={
      this.props.dialOutgoing(
        '+4400...',
        '<Current User ID>',
        '<Contact Name>',
        '<Contact ID.',
        '<Enquiry ID>'
      )
    }
  >
  Call
  </a>

</LCNTwilioCaller>
```

The Twilio Device can be accessed using `this.props.caller`. More details can be found in the [Twilio Docs](https://www.twilio.com/docs/voice/client/javascript/device).
