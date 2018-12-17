import React, { Component } from 'react';
import axios from 'axios';

class Fib extends Component {
  state = {
    seenIndexes: [],
    values: {},
    index: ''
  }

  componentDidMount() {
    this.fetchValues();
    this.fetchIndexes();
  }

  async fetchValues() {
    const values = await axios.get('/api/values/current');
    this.setState({ values: values.data });
  }

  async fetchIndexes() {
    const seenIndexes = await axios.get('/api/values/all');
    this.setState({
      seenIndexes: seenIndexes.data
    });
  }

  handleSubmit = async (event) => { // we want 'handleSubmit' to be a "bound function"
    // async func, since we'll try to send some info to our backend api
    event.preventDefault();

    await axios.post('/api/values', {
      index: this.state.index
    })
    this.setState({ index: '' });
    console.log(this.state.index)
  };

  renderSeenIndexes() {
    // 'seenIndexes': an arry with objects, each of which has a number property (array is default return type when pulling data out of postgres)
    return this.state.seenIndexes.map(({ number }) => number) // just pull out and return the number from each object in the array 
      .join(', ');  // take those numbers and join them with ',' 
  }

  renderValues() {
    // when pulling data out of redis(now in state as 'this.state.values'), we get back an object (with key value pairs)
    const entries = [];

    for (let key in this.state.values) { // 'key' represents the index of fib number
      entries.push(
        <div key={key}>
          for index {key} I calculated {this.state.values[key]}
        </div>
      )
    }

    return entries;
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label>Enter your index:</label>
          <input
            value={this.state.index}
            onChange={event => this.setState({ index: event.target.value })} // take the event and update our state
          />
          <button>Submit</button>
        </form>

        <h3>Indices I have seen:</h3>
        {this.renderSeenIndexes()}

        <h3>Calculated Values:</h3>
        {this.renderValues()}
      </div>
    )
  }
}

export default Fib;