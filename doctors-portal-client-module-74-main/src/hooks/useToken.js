import { useEffect, useState } from "react";

const useToken = (email) => {
  const [token, setToken] = useState("");

  useEffect(() => {
    if (email) {
      const url = `http://localhost:5000/jwt?email=${email}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          console.log(data);

          if (data.accessToken) {
            localStorage.setItem("access-token", data.accessToken);
            setToken(data.accessToken);
          }
        });
    }
  }, [email]);

  return [token];
};
export default useToken;

// const getUserToken = (email) => {

//     const url = `http://localhost:5000/jwt?email=${email}`;
//     fetch(url)
//       .then((res) => res.json())
//       .then((data) => {
//         console.log(data);

//         if (data.accessToken) {
//           localStorage.setItem("access-token", data.accessToken);
//         }
//       });
//   };
