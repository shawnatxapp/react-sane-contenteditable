import ReactDOM from 'react-dom';
import React, { Component } from 'react';
import ContentEditable from '../src/react-sane-contenteditable';

class App extends Component {
  state = {
    title: 'Title here',
    isFocused: false
  };

  handleBlur = (ev) => {
    this.setState({ isFocused: false });
  };

  handleChange = (ev, value) => {
    this.setState({ title: value });
  };

  handleFocus = (ev) => {
    this.setState({ isFocused: true });
  }

  handleKeyDown = (ev, value) => {
    this.setState({ title: value });
  };

  render() {
    return (
      <div className="App">
        <ContentEditable
          focus={this.state.isFocused}
          tagName="div"
          className="my-class"
          content={this.state.title}
          editable={true}
          maxLength={140}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          onFocus={this.handleFocus}
          onKeyDown={this.handleKeyDown}
        />

        <b>Value:</b>
        <pre
          style={{
            fontSize: 14,
            fontFamily: "'Courier New', Courier, 'Lucida Sans Typewriter', 'Lucida Typewriter', monospace",
          }}
        >
          {this.state.title}
        </pre>

        <b>Focused:</b>
        <pre>{this.state.isFocused.toString()}</pre>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
