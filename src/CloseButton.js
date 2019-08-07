import React from 'react'
import {
  Image,
  Platform,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native'
import PropTypes from 'prop-types'

const CloseButtonAndroid = (props) => (
  <View style={props.styles[0]}>
    <TouchableNativeFeedback
      background={
        Platform.Version < 21
          ? TouchableNativeFeedback.SelectableBackground()
          : TouchableNativeFeedback.SelectableBackgroundBorderless()
      }
      onPress={props.onPress}
    >
      <View>
        <Image source={props.image} style={props.styles[1]} />
      </View>
    </TouchableNativeFeedback>
  </View>
)

const CloseButtonDefault = (props) => (
  <View style={props.styles[0]}>
    <TouchableOpacity onPress={props.onPress}>
      <Image source={props.image} style={props.styles[1]} />
    </TouchableOpacity>
  </View>
)

const CloseButton = props => {
  const closeImage = props.image
    ? props.image
    : Platform.select({
      android: require('./android-close.png'),
      default: require('./ios7-close-empty.png')
    })

  return Platform.select({
    android: <CloseButtonAndroid {...props} image={closeImage} />,
    default: <CloseButtonDefault {...props} image={closeImage} />
  })
}

CloseButton.propTypes = {
  styles: PropTypes.array,
  onPress: PropTypes.func,
  image: PropTypes.any
}

CloseButtonAndroid.propTypes = CloseButton.propTypes
CloseButtonDefault.propTypes = CloseButton.propTypes

export default CloseButton
