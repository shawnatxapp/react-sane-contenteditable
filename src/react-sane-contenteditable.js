import React, { Component } from 'react';
import PropTypes from 'prop-types';

const reduceTargetKeys = (target, keys, predicate) => Object.keys(target).reduce(predicate, {});

const omit = (target = {}, keys = []) =>
  reduceTargetKeys(target, keys, (acc, key) => keys.some(omitKey => omitKey === key) ? acc : { ...acc, [key]: target[key] });

const pick = (target = {}, keys = []) =>
  reduceTargetKeys(target, keys, (acc, key) => keys.some(pickKey => pickKey === key) ? { ...acc, [key]: target[key] } : acc);

const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const propTypes = {
  content: PropTypes.string,
  editable: PropTypes.bool,
  focus: PropTypes.bool,
  maxLength: PropTypes.number,
  multiLine: PropTypes.bool,
  sanitise: PropTypes.bool,
  caretPosition: PropTypes.oneOf(['start', 'end']),
  tagName: PropTypes.oneOfType([PropTypes.string, PropTypes.func]), // The element to make contenteditable. Takes an element string ('div', 'span', 'h1') or a styled component
  innerRef: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
  onPaste: PropTypes.func,
  onChange: PropTypes.func,
  styled: PropTypes.bool, // If element is a styled component (uses innerRef instead of ref)
};

const defaultProps = {
  content: '',
  editable: true,
  focus: false,
  maxLength: Infinity,
  multiLine: false,
  sanitise: true,
  caretPosition: null,
  tagName: 'div',
  innerRef: () => {},
  onBlur: () => {},
  onKeyDown: () => {},
  onPaste: () => {},
  onChange: () => {},
  styled: false,
};

class ContentEditable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: this.sanitiseValue(props.content),
    };
  }

  componentDidMount() {
    this.setFocus();
    this.setCaret();
  }

  // shouldComponentUpdate(nextProps) {
  //   const propKeys = Object.keys(nextProps);
  //   return !isEqual(pick(nextProps, propKeys), pick(this.props, propKeys));
  // }

  componentDidUpdate() {
    this.setValue();
    this.setFocus();
    this.setCaret();
  }

  setValue() {
    const { content } = this.props;

    if (content !== this.sanitiseValue(this.state.value)) {
      this.setState({ value: content });
    }
  }

  setFocus() {
    if (this.props.focus && this._element) {
      this._element.focus();
    }
  };

  setCaret() {
    const { caretPosition } = this.props;

    if (caretPosition && this._element) {
      const { value } = this.state;
      const offset = value.length && caretPosition === 'end' ? 1 : 0;
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStart(this._element, offset);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  sanitiseValue(value) {
    const { maxLength, multiLine, sanitise } = this.props;

    if (!sanitise) {
      return value;
    }

    const doubleWhitespace = multiLine ? /[\t\v\f\r ]+/g : /\s+/g;

    return value
      .replace(/&nbsp;|[\u00a0\u2000-\u200b\u2028-\u2029\u202e-\u202f\u3000]/g, ' ')
      .replace(doubleWhitespace, ' ')
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n') // replace 3+ line breaks with two
      .trim()
      .substr(0, maxLength);
  }

  _onChange = ev => {
    const value = this.sanitiseValue(ev.target.innerText);

    if (this.state.value !== value) {
      this.setState({ value }, () => {
        this.props.onChange(ev, this.state.value);
        console.log('_onChange', this.state.value, value);
      });
    }
  };

  _onPaste = ev => {
    const { maxLength } = this.props;

    ev.preventDefault();
    const text = ev.clipboardData.getData('text').substr(0, maxLength);
    document.execCommand('insertText', false, text);

    this.props.onPaste(ev);
  };

  _onBlur = ev => {
    this.setState({
      value: this.sanitiseValue(ev.target.innerText),
    }, () => {
      this.props.onChange(ev, this.state.value);
      this.props.onBlur(ev);
    });
  };

  _onKeyDown = ev => {
    const { maxLength, multiLine } = this.props;
    const value = ev.target.innerText;

    // return key
    if (!multiLine && ev.keyCode === 13) {
      ev.preventDefault();
      ev.currentTarget.blur();
      // Call onKeyUp directly as ev.preventDefault() means that it will not be called
      this._onKeyUp(ev);
    }

    // Ensure we don't exceed `maxLength` (keycode 8 === backspace)
    if (maxLength && !ev.metaKey && ev.which !== 8 && value.replace(/\s\s/g, ' ').length >= maxLength) {
      ev.preventDefault();
      // Call onKeyUp directly as ev.preventDefault() means that it will not be called
      this._onKeyUp(ev);
    }
  };

  _onKeyUp = ev => {
    // Call prop.onKeyDown callback from the onKeyUp event to mitigate both of these issues:
    // Access to Synthetic event: https://github.com/ashleyw/react-sane-contenteditable/issues/14
    // Current value onKeyDown: https://github.com/ashleyw/react-sane-contenteditable/pull/6
    // this._onKeyDown can't be moved in it's entirety to onKeyUp as we lose the opportunity to preventDefault
    this.props.onKeyDown(ev, ev.target.innerText);
  };

  render() {
    const { tagName: Element, editable, styled, ...props } = this.props;

    return (
      <Element
        {...omit(props, Object.keys(propTypes))}
        {...(styled
          ? {
              innerRef: c => {
                this._element = c;
                props.innerRef(c);
              },
            }
          : {
              ref: c => {
                this._element = c;
                props.innerRef(c);
              },
            })}
        style={{ whiteSpace: 'pre-wrap', ...props.style }}
        contentEditable={editable}
        dangerouslySetInnerHTML={{ __html: this.state.value }}
        onBlur={this._onBlur}
        onInput={this._onChange}
        onKeyDown={this._onKeyDown}
        onKeyUp={this._onKeyUp}
        onPaste={this._onPaste}
      />
    );
  }
}

ContentEditable.propTypes = propTypes;
ContentEditable.defaultProps = defaultProps;

export default ContentEditable;
