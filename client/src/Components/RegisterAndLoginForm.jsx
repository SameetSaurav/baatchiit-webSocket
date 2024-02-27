import axios from "axios"
import { useContext, useState } from "react"
import { UserContext } from "../UserContext"

const RegisterAndLoginForm = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginOrRegister, setIsLoginOrRegister] = useState('register')
  const {setUsername: setLoggedInUsername, setId} = useContext(UserContext)

  async function handleSubmit(ev) {
    ev.preventDefault();
    const url = isLoginOrRegister === 'register' ? "/register" : "/login"
    const {data} = await axios.post(url, {username,password})
    setLoggedInUsername(username)
    setId(data.id)
    
  }

  return (
    <div>
      <div className="bg-green-50 h-screen flex items-center ">
        <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
          <input value={username} onChange={ev => setUsername(ev.target.value)} className = "block w-full p-2 mb-2 rounded-sm border" type="text" placeholder="Username" />
          <input value={password} onChange={ev => setPassword(ev.target.value)} className = "block w-full p-2 mb-2 rounded-sm border" type="password" placeholder="Password" />
          <button className='bg-green-500 text-white block w-full rounded-sm'>
            {isLoginOrRegister === 'register' ? 'Register' : 'Login'} 
          </button>
          <div className="mt-2 text-center">
            {isLoginOrRegister === 'login' && (
              <div>Don't have an account? <button onClick={() => setIsLoginOrRegister('register')}>Register here</button></div>
            )}
            {isLoginOrRegister === 'register' && (
              <div>Already have an account? <button onClick={() => setIsLoginOrRegister('login')}>Login here</button></div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterAndLoginForm