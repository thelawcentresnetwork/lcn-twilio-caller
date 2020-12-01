# LCN Twilio Caller

React component to receive and place voice calls in the browser using Twilio.

```
npm install lcn-twilio-caller
```

![LCN Twilio Caller](https://raw.githubusercontent.com/thelawcentresnetwork/lcn-twilio-caller/main/demo/lcn-twilio-caller.gif)

## Setup

Twilio requires your app to generate a capability token before use, our component makes a POST request to `/twilio/capability` and expects a token back.

A POST request will also be made to `/twilio/calls/answer` when a call is answered if you wish to log who answered a call in your application.

## Usage

Wrap your React app in the `LCNTwilioCaller` component then use `this.props.dialOutgoing` to make calls.

Incoming calls will automatically ring if the user has set themselves available.

```
import LCNTwilioCaller from 'lcn-twilio-caller';

<LCNTwilioCaller>
  this.props.dialOutgoing(
    '+4400...',
    'Enquiry ID',
    'Current User ID',
    'Contact Name',
    'Contact ID'
  )
  <App />
</LCNTwilioCaller>
```

The Twilio Device can be accessed using `this.props.caller`. More details can be found in the [Twilio Docs](https://www.twilio.com/docs/voice/client/javascript/device).
