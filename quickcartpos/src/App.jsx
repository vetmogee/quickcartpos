import { BrowserRouter as Router, Route, Routes, BrowserRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Test from './pages/main.jsx';
import Login from './pages/login.jsx';
import Register from './pages/register.jsx';
import './App.jsx';

function App (){
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Test />}/>
                <Route path='/login' element={<Login />}/>
                <Route path='/register' element={<Register />}/>
            </Routes>
        </BrowserRouter>
    );
};

export default App;