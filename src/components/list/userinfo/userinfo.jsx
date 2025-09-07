import "./userinfo.css";
import { useUserStore } from "../../lib/userStore";

function Userinfo() {
  const { currentUser } = useUserStore();

  return (
    <div className="userinfo">
      <div className="user">
        <img src="./profile.png" alt="avatar" className="avatar" />
<h4>{currentUser?.username?.toUpperCase() || "USER"}</h4>

        <div className="imgs">
          <img src="./more.png" alt="more options" className="icon" />
          <img src="./video.png" alt="video call" className="icon" />
          <img src="./info.png" alt="edit profile" className="icon" />
        </div>
      </div>
    </div>
  );
}

export default Userinfo;
