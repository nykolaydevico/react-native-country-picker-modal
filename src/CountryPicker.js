import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  Image,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import Fuse from 'fuse.js'
import cca2List from '../data/cca2'
import { getHeightPercent } from './ratio'
import CloseButton from './CloseButton'
import countryPickerStyles from './CountryPicker.style'
import KeyboardAvoidingView from './KeyboardAvoidingView'

let countries = null
let Emoji = null
let styles = {}

let isEmojiable = Platform.OS === 'ios'

const FLAG_TYPES = {
  flat: 'flat',
  emoji: 'emoji'
}

const setCountries = flagType => {
  if (typeof flagType !== 'undefined') {
    isEmojiable = flagType === FLAG_TYPES.emoji
  }

  if (isEmojiable) {
    countries = require('../data/countries-emoji')
    Emoji = require('./emoji').default
  } else {
    countries = require('../data/countries')
    Emoji = <View />
  }
}

setCountries()

export const getAllCountries = () => cca2List.map(cca2 =>
  ({ ...countries[cca2], cca2 })
)

export default class CountryPicker extends Component {
  static propTypes = {
    cca2: PropTypes.string.isRequired,
    translation: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    onClose: PropTypes.func,
    closeable: PropTypes.bool,
    filterable: PropTypes.bool,
    children: PropTypes.node,
    countryList: PropTypes.array,
    excludeCountries: PropTypes.array,
    styles: PropTypes.object,
    filterPlaceholder: PropTypes.string,
    autoFocusFilter: PropTypes.bool,
    // to provide a functionality to disable/enable the onPress of Country Picker.
    disabled: PropTypes.bool,
    filterPlaceholderTextColor: PropTypes.string,
    closeButtonImage: PropTypes.element,
    transparent: PropTypes.bool,
    animationType: PropTypes.oneOf(['slide', 'fade', 'none']),
    flagType: PropTypes.oneOf(Object.values(FLAG_TYPES)),
    hideAlphabetFilter: PropTypes.bool,
    renderFilter: PropTypes.func,
    showCallingCode: PropTypes.bool,
    filterOptions: PropTypes.object
  }

  static defaultProps = {
    translation: 'eng',
    countryList: cca2List,
    excludeCountries: [],
    filterPlaceholder: 'Filter',
    autoFocusFilter: true,
    styles: {},
    transparent: false,
    animationType: 'none'
  }

  static renderEmojiFlag(cca2, emojiStyle) {
    return (
      <Text style={[countryPickerStyles.emojiFlag, emojiStyle]} allowFontScaling={false}>
        {cca2 !== '' && countries[cca2.toUpperCase()] ? (
          <Emoji name={countries[cca2.toUpperCase()].flag} />
        ) : null}
      </Text>
    )
  }

  static renderImageFlag(cca2, imageStyle) {
    return cca2 !== '' ? (
      <Image
        style={[countryPickerStyles.imgStyle, imageStyle]}
        source={{ uri: countries[cca2].flag }}
      />
    ) : null
  }

  static renderFlag(cca2, itemStyle, emojiStyle, imageStyle) {
    return (
      <View style={[countryPickerStyles.itemCountryFlag, itemStyle]}>
        {isEmojiable
          ? CountryPicker.renderEmojiFlag(cca2, emojiStyle)
          : CountryPicker.renderImageFlag(cca2, imageStyle)}
      </View>
    )
  }

  openModal = this.openModal.bind(this)

  // dimensions of country list and window
  itemHeight = getHeightPercent(7)

  listHeight = countries.length * this.itemHeight

  constructor(props) {
    super(props)
    this.openModal = this.openModal.bind(this)

    setCountries(props.flagType)
    let countryList = [...props.countryList]
    const excludeCountries = [...props.excludeCountries]

    excludeCountries.forEach(excludeCountry => {
      const index = countryList.indexOf(excludeCountry)

      if (index !== -1) {
        countryList.splice(index, 1)
      }
    })

    // Sort country list
    countryList = countryList
      .map(c => [c, this.getCountryName(countries[c])])
      .sort((a, b) => {
        if (a[1] < b[1]) return -1
        if (a[1] > b[1]) return 1
        return 0
      })
      .map(c => c[0])

    this.state = {
      modalVisible: false,
      cca2List: countryList,
      flatListMap: countryList.map(n => ({ key: n })),
      filter: '',
      letters: this.getLetters(countryList)
    }

    styles = countryPickerStyles

    const options = Object.assign({
      shouldSort: true,
      threshold: 0.6,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ['name'],
      id: 'id'
    }, this.props.filterOptions);
    this.fuse = new Fuse(
      countryList.reduce(
        (acc, item) => [
          ...acc,
          { id: item, name: this.getCountryName(countries[item]) }
        ],
        []
      ),
      options
    )
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.countryList !== this.props.countryList) {
      this.setState({
        cca2List: nextProps.countryList,
        dataSource: ds.cloneWithRows(nextProps.countryList)
      })
    }
  }

  onSelectCountry(cca2) {
    this.setState(state => ({
      modalVisible: false,
      filter: '',
      flatListMap: state.cca2List.map(n => ({ key: n }))
    }), () => {
      this.props.onChange({
        cca2,
        ...countries[cca2],
        flag: undefined,
        name: this.getCountryName(countries[cca2])
      })
    })
  }

  onClose = () => {
    this.setState(state => ({
      modalVisible: false,
      filter: '',
      flatListMap: state.cca2List.map(n => ({ key: n }))
    }), () => {
      if (this.props.onClose) {
        this.props.onClose()
      }
    })
  }

  getCountryName(country, optionalTranslation) {
    const translation = optionalTranslation || this.props.translation || 'eng'
    return country.name[translation] || country.name.common
  }

  setVisibleListHeight(offset) {
    this.visibleListHeight = getHeightPercent(100) - offset
  }

  getLetters(list) {
    return Object.keys(
      list.reduce(
        (acc, val) => ({
          ...acc,
          [this.getCountryName(countries[val])
            .slice(0, 1)
            .toUpperCase()]: ''
        }),
        {}
      )
    ).sort()
  }

  handleFilterChange = value => {
    const filteredCountries = value === ''
      ? this.state.cca2List
      : this.fuse.search(value)

    this._flatList.scrollToItem({ y: 0 })

    this.setState(() => ({
      filter: value,
      flatListMap: filteredCountries.map(n => ({ key: n }))
    }))
  }

  scrollTo(letter) {
    // find position of first country that starts with letter
    const index = this.state.cca2List
      .map(country => this.getCountryName(countries[country])[0])
      .indexOf(letter)
    if (index === -1) {
      return
    }
    let position = index * this.itemHeight

    // do not scroll past the end of the list
    if (position + this.visibleListHeight > this.listHeight) {
      position = this.listHeight - this.visibleListHeight
    }

    // scroll
    this._flatList.scrollToIndex({ index });
  }

  openModal() {
    this.setState({ modalVisible: true })
  }

  renderCountry(cca2, index) {
    const country = countries[cca2]
    return (
      <View
        key={index}
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => this.onSelectCountry(cca2)}
        style={[styles.itemCountry, this.props.styles.itemCountry]}
      >
        {CountryPicker.renderFlag(cca2)}
        <View style={[styles.itemCountryName, this.props.styles.itemCountryName]}>
          <Text style={styles.countryName} allowFontScaling={false}>
            {this.getCountryName(country)}
            {this.props.showCallingCode && country.callingCode &&
              <Text style={[styles.callingCode, this.props.styles.callingCode]}>
                {` (+${country.callingCode})`}
              </Text>
            }
          </Text>
        </View>
      </View>
    )
  }

  renderLetters(letter, index) {
    return (
      <TouchableOpacity
        key={index}
        onPress={() => this.scrollTo(letter)}
        activeOpacity={0.6}
      >
        <View style={[styles.letter, this.props.styles.letter]}>
          <Text style={[styles.letterText, this.props.styles.letterText]} allowFontScaling={false}>
            {letter}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  renderFilter = () => {
    const {
      renderFilter,
      autoFocusFilter,
      filterPlaceholder,
      filterPlaceholderTextColor
    } = this.props

    const value = this.state.filter
    const {
      handleFilterChange: onChange,
      onClose
    } = this

    return renderFilter ? (
      renderFilter({ value, onChange, onClose })
    ) : (
      <TextInput
        autoFocus={autoFocusFilter}
        autoCorrect={false}
        placeholder={filterPlaceholder}
        placeholderTextColor={filterPlaceholderTextColor}
        style={[
          styles.input,
          this.props.styles.input,
          !this.props.closeable && styles.inputOnly,
          !this.props.closeable && this.props.styles.inputOnly
        ]}
        onChangeText={onChange}
        value={value}
      />
    )
  }

  render() {
    return (
      <View style={[styles.container, this.props.styles.container]}>
        <TouchableOpacity
          disabled={this.props.disabled}
          onPress={() => this.setState({ modalVisible: true })}
          activeOpacity={0.7}
        >
          {this.props.children ? this.props.children : (
            <View
              style={[
                styles.touchFlag,
                this.props.styles.touchFlag,
                { marginTop: isEmojiable ? 0 : 5 }
              ]}
            >
              {CountryPicker.renderFlag(this.props.cca2,
                { ...styles.itemCountryFlag, ...this.props.styles.itemCountryFlag },
                { ...styles.emojiFlag, ...this.props.styles.emojiFlag },
                { ...styles.imgStyle, ...this.props.styles.imgStyle })}
            </View>
          )}
        </TouchableOpacity>
        <Modal
          transparent={this.props.transparent}
          animationType={this.props.animationType}
          visible={this.state.modalVisible}
          onRequestClose={() => this.setState({ modalVisible: false })}
        >
          <SafeAreaView style={[styles.modalContainer, this.props.styles.modalContainer]}>
            <View style={[styles.header, this.props.styles.header]}>
              {this.props.closeable && (
                <CloseButton
                  image={this.props.closeButtonImage}
                  styles={[
                    [styles.closeButton, this.props.styles.closeButton],
                    [styles.closeButtonImage, this.props.styles.closeButtonImage]
                  ]}
                  onPress={() => this.onClose()}
                />
              )}
              {this.props.filterable && this.renderFilter()}
            </View>
            <KeyboardAvoidingView
              behavior="padding"
              contentContainerStyle={[
                styles.keyboardViewContent,
                this.props.styles.keyboardViewContent
              ]}
              style={[styles.keyboardView, this.props.styles.keyboardView]}
            >
              <View style={[styles.contentContainer, this.props.styles.contentContainer]}>
                <FlatList
                  keyboardShouldPersistTaps="always"
                  enableEmptySections
                  ref={flatList => (this._flatList = flatList)}
                  data={this.state.flatListMap}
                  // renderRow={country => this.renderCountry(country)}
                  renderItem={country => this.renderCountry(country.item.key)}
                  initialListSize={30}
                  pageSize={15}
                  onLayout={({ nativeEvent: { layout: { y: offset } } }) =>
                    this.setVisibleListHeight(offset)
                  }
                  style={[styles.listView, this.props.styles.listView]}
                />
                {!this.props.hideAlphabetFilter && (
                  <ScrollView
                    contentContainerStyle={[styles.letters, this.props.styles.letters]}
                    keyboardShouldPersistTaps="always"
                  >
                    {this.state.filter === '' &&
                      this.state.letters.map((letter, index) =>
                        this.renderLetters(letter, index)
                      )
                    }
                  </ScrollView>
                )}
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      </View>
    )
  }
}
