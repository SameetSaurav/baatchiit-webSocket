import { useContext, useEffect } from "react";
import RegisterAndLoginForm from "./Components/RegisterAndLoginForm";
import { UserContext } from "./UserContext";
import Chat from "./Components/Chat";

export default function Routes() {
    const {username, id} = useContext(UserContext)
    if(username){
        return <Chat />
    } 
    
    return (
        <RegisterAndLoginForm />
    )
}