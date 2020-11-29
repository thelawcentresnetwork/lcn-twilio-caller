# LCN Twilio Caller

React component to receive and place voice calls in the browser using Twilio.



## Usage

Wrap your React app in the `LCNTwilioCaller component` then use `this.props.dialOutgoing` to make calls.

Incoming calls will automatically ring if the user has set themselves available.

```
import LCNTwilioCaller from 'lcn-twilio-caller';

<LCNTwilioCaller>
  this.props.dialOutgoing(
    '+4400...',
    'Enquiry ID',
    'Current User ID',
    'Caller ID'
  )
  <App />
</LCNTwilioCaller>
```

The Twilio Device can be accessed using `this.props.caller`. More details can be found in the [Twilio Docs](https://www.twilio.com/docs/voice/client/javascript/device).
