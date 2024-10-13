import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BorrowList = ({ user }) => {
  const [data, setData] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const navigate = useNavigate();
  console.log("User is "+ user);

  const addToCart = async () => {
      const books = selectedBooks;
      const username = user.username;
      const send = { books: books, username: username };
      console.log(send);
      await axios
        .post(`http://localhost:5000/addToCart`, send, {})
        .then((response) => {
          console.log(response);
        });
      setTimeout(() => {
        window.location.href = "/cart";
      }, 500);
  };
  console.log(selectedBooks);

  const fetchData = async () => {
    // setInterval(async () => {
    const response = await axios.get("http://localhost:5000/borrowedBooks");
    setData(response.data);
    // }, 1500);
    console.log(response.data);
  };
  // console.log(data);
  useEffect(() => {
    fetchData();
  }, []);

  function formatDate(dateStr) {
    const currentDate = new Date();
    const date = new Date(dateStr);
    const options = { day: "numeric", month: "long", year: "numeric" };

    // Calculate the difference in days
    const timeDiff = Math.abs(currentDate.getTime() - date.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (diffDays > 8) {
      return `Due by ${diffDays} days`;
    } else {
      // Format and return the date
      const formattedDate = date.toLocaleDateString("en-US", options);
      return formattedDate;
    }
  }

  const handleCheckboxChange = (e, id) => {
    if (e.target.checked) {
      setSelectedBooks((prevSelectedBooks) => [...prevSelectedBooks, id]);
    } else {
      setSelectedBooks((prevSelectedBooks) =>
        prevSelectedBooks.filter((bookId) => bookId !== id)
      );
    }
    console.log(selectedBooks);
  };

  //variables
  const [currentPage, setCurrentPage] = useState(1);
  const recordPerPage = 10;
  const lastIndex = currentPage * recordPerPage;
  const firstIndex = lastIndex - recordPerPage;
  const record = data.slice(firstIndex, lastIndex);
  const npage = Math.ceil(data.length / recordPerPage);
  const number = [...Array(npage + 1).keys()].slice(1);

  const nextPage = () => {
    if (currentPage != npage) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage != 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  return (
    <div
      style={{
        display: "flex",
        // border: "1px solid grey",
        boxShadow: "1px 1px 21px -3px rgba(0,0,0,10.75)",
        flexDirection: "column",
        justifyContent: "center",
        margin: "1rem",
        borderRadius: "1.5rem",
        padding: "0.5rem",
      }}
    >
      {data.length > 0 ? (
        <>
          <div>
            <img
              className="vert-move"
              style={{
                width: "40%",
                marginLeft: "30%",
                // marginRight: "50%",
                // height: "30%",
              }}
              src="https://raw.githubusercontent.com/AnuragRoshan/images/71611a64e2b0acde9f0527b4f2341fabd7bf9555/undraw_process_re_gws7.svg"
              alt=""
              srcset=""
            />
          </div>
          <div style={{ justifyContent: "center", paddingInlineStart: "5rem" }}>
            <table className="table">
              <thead style={{ backgroundColor: "#3d5a80", color: "white" }}>
                <th style={{ width: "5rem", textAlign: "left" }}>#</th>
                <th style={{ width: "15rem", textAlign: "left" }}>Borrower</th>
                <th style={{ width: "15rem", textAlign: "left" }}>Book Name</th>
                <th style={{ width: "15rem", textAlign: "left" }}>Author</th>
                <th style={{ width: "15rem", textAlign: "left" }}>
                  Due/Borrowed Date
                </th>
                <th style={{ width: "15rem", textAlign: "left" }}>Returned</th>
              </thead>
              <tbody>
                {record.map((d, i) => (
                  <tr>
                    <td style={{}}>{(currentPage - 1) * 10 + i + 1}</td>
                    <td style={{ padding: "0.5rem" }}>{d.borrower}</td>
                    <td style={{ padding: "0.5rem" }}>{d.title}</td>
                    <td style={{ padding: "0.5rem" }}>{d.author}</td>
                    <td style={{ padding: "0.5rem" }}>
                      {formatDate(d.takenDate)}
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      <input
                        type="checkbox"
                        onChange={(e) => handleCheckboxChange(e, d.isbn)}
                        checked={selectedBooks.includes(d.isbn)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            style={{
              textAlign: "center",
              marginBlockStart: "2rem",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <div
              className="land-button lists-button"
              style={{ margin: "0 1rem", padding: "0", cursor: "pointer" }}
              onClick={prevPage}
            >
              <a
                className="landing-button-hover"
                style={{ width: "5rem", margin: "10px" }}
              >
                <span>PREV</span>
              </a>
            </div>

            <div style={{ paddingBlockStart: "1rem" }}>{currentPage}</div>
            <div
              className="land-button"
              style={{ margin: "0 1rem", padding: "0", cursor: "pointer" }}
              onClick={nextPage}
            >
              <a
                className="landing-button-hover"
                style={{ width: "5rem", margin: "10px" }}
              >
                <span>NEXT</span>
              </a>
            </div>
          </div>
          <div
            style={{
              marginLeft: "45rem",
              // marginBlockEnd: "2rem",
            }}
          >
            <div
              className="land-button"
              style={{ cursor: "pointer" }}
              onClick={addToCart}
            >
              <a
                className="landing-button-hover"
                style={{
                  width: "12  rem",
                }}
              >
                <span>SAVE CHANGE</span>
              </a>
            </div>
            <div style={{ marginLeft: "8.4rem" }}>
              Save Returned Status of Borrower
            </div>
          </div>
        </>
      ) : (
        <div className="loaders book">
          <figure className="page"></figure>
          <figure className="page"></figure>
          <figure className="page"></figure>
        </div>
      )}
    </div>
  );
};

export default BorrowList;
