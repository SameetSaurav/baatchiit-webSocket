import Avatar from './Avatar'

const Contact = ({id,username,onClick,selected,online}) => {
  return (
    <div>
        <div key={id} onClick={() => onClick(id)} className={"border-b border-gray-100 py-2 pl-4 flex items-center gap-2 cursor-pointer "+(selected ? "bg-green-200" : "")}>
            <Avatar online={online} username={username} userId={id} />
            <span >{username}</span>
        </div>
    </div>
  )
}

export default Contact