import React from 'react';
import { Link } from 'react-router-dom';

export default () => {
  return (
    <div>
      Some other page
      <Link to="/">Link to go back home</Link>
    </div>
  )
}