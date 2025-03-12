import {BrowserRouter, Routes, Route} from 'react-router-dom'
import LoginView from './views/LoginView'
import Register from './views/Register'


export default function Router(){

    return(
        <BrowserRouter>
            <Routes>
                <Route>
                    <Route path='/auth/login' element={<LoginView/>} />
                    <Route path='/auth/register' element={<Register/>} />
                   
                    
                </Route>
            </Routes>
        
        </BrowserRouter>




    )

}