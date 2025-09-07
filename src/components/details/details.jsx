import { auth } from "../lib/firebase";
import "./details.css"
import { useChatStore } from "../lib/chatStore";
function Details(){

  const { user: selectedUser } = useChatStore();

    return(
<div className="details">
<div className="user">
      <img src="./profile2.png" alt="" />  
   <h3>{selectedUser.username || "Unknown User"}</h3>
 <p> Born as a man die as a god</p>
</div>
<div className="info">
<div className="option">
    <div className="title">
           <p>Chat Settings</p>
        <img src="./arrowUp.png"  className="arrow"alt="" />
    </div>
</div>

<div className="option">
    <div className="title">
        <p>Privacy & Help</p>
        <img src="./arrowUp.png" alt="" className="arrow" />
    </div>
</div>

<div className="option">
    <div style={{marginBottom:"20px"}} className="title">
        <p>Shared Photos</p>
        <img src="./arrowUp.png" className="arrow" alt="" />
    </div>
    


</div>



<button >Block User</button>
<div onClick={()=>auth.signOut()} style={{backgroundColor:"skyblue" ,padding:"10px" ,borderRadius:"5px",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>LogOut</div>
</div>


</div>
    )
}
export default Details;
