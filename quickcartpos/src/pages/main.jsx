import React, { useState } from 'react';
import { Link } from 'react-router-dom';   

function Test(){
    return(
        <div>
            <Link to="/login">
                <button>Login</button>
            </Link>
            <Link to="/register">
                <button>Register</button>
            </Link>
        </div>
    )
};

export default Test;