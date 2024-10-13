import axios from "axios";
import React, { useEffect, useState } from "react";
import "../../Assets/css/cart.css";

const Cart = ({ user }) => {
  const [data, setData] = useState([null]);
  const [isLoading, setIsLoading] = useState(true); // Add isLoading state
  console.log(user);
  
  const fetchData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/booksInCart/${user.username}`
      );
      setData(response.data.books);
      console.log(data);
      setIsLoading(false); // Set isLoading to false when data is fetched
    } catch (error) {
      console.error(error);
    }
  };

  const proceedCheckout = async () => {
    const username = user.username;
    const send = { username: username };
    await axios
      .post(`http://localhost:5000/checkout`, send)
      .then((response) => {
        console.log(response);
      });
    setTimeout(() => {
      window.location.href = "/home";
    }, 500);
  };

  useEffect(() => {
    fetchData();
  }, [proceedCheckout]);

  useEffect(() => {
    fetchData();
  }, [proceedCheckout]);

  if (data == null) {
    return <>NULL H RE BABA</>;
  } else
    return (
      <div style={{ paddingBlockStart: "4rem" }}>
        <div style={{ display: "flex" }}>
          <div style={{ flex: "5" }}>
            {isLoading ? ( // Render loading state when isLoading is true
              <div>
                <img
                  style={{
                    width: "10rem",
                    marginInlineStart: "10.5em",
                    marginBlockStart: "9rem",
                  }}
                  src="https://raw.githubusercontent.com/AnuragRoshan/images/2da16323d0b50258ee4a9f8ffe0ec96bf73ed0b9/undraw_happy_music_g6wc.svg"
                  alt=""
                  srcset=""
                />
                <div
                  style={{
                    textAlign: "center",
                    fontFamily: "poppins",
                    fontSize: "2rem",
                  }}
                >
                  Cart is empty <br /> Add Some Books
                </div>
              </div>
            ) : data.length === 0 ? (
              <></>
            ) : (
              <>
                <div>
                  <div style={{ padding: "2rem" }}>
                    <div style={{ display: "flex" }}>
                      <div style={{ fontFamily: "poppins", fontSize: "3rem" }}>
                        CART
                      </div>
                      <div className="cart-button" onClick={proceedCheckout}>
                        Checkout
                      </div>
                    </div>
                    {data.map((d, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          width: "100%",
                          border: "1px solid transparent",
                          backgroundColor: "white",
                          marginBlockEnd: "1rem",
                        }}
                      >
                        <div>
                          <img
                            src="https://covers.openlibrary.org/b/isbn/1933988746-L.jpg"
                            alt=""
                            srcset=""
                            style={{
                              width: "5rem",
                              height: "6rem",
                              marginTop: "0rem",
                              padding: "0.4rem 1rem",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            fontFamily: "poppins",
                            padding: "0.4rem 1rem",
                            fontSize: "0.9rem",
                          }}
                        >
                          <div>Title : {d.Title}</div>
                          <div>Author : {d.Author}</div>
                          <div>Publisher : {d.Publisher}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div style={{ flex: "8", backgroundColor: "white" }}>
            <img
              style={{ height: "86vh" }}
              src="https://raw.githubusercontent.com/AnuragRoshan/images/8b58d063ae66f90faefec23c75fe787161fc66ca/undraw_empty_cart_co35.svg"
              alt=""
              srcset=""
            />
          </div>
        </div>
      </div>
    );
};

export default Cart;
