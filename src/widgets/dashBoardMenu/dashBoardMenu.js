import React from "react";

class DashBoardMenu extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      inputText: "enter name",
      checkMark: "faIcon",
      // dashBoardData: [],
    };
    this.handleChange = this.handleChange.bind(this);
    this.deleteDashBoard = this.deleteDashBoard.bind(this);
    this.showCheckMark = this.showCheckMark.bind(this);
  }

  componentDidMount() {
    // console.log("mounted");
    this.props.getSavedDashBoards(); //might not be needed
  }

  handleChange(e) {
    this.setState({ inputText: e.target.value.toUpperCase() });
  }

  deleteDashBoard(dashBoardId) {
    fetch(`/deleteSavedDashboard?dashID=${dashBoardId}`)
      .then((response) => response.json())
      .then((data) => {
        // console.log(data);
        this.props.getSavedDashBoards();
      })
      .catch((error) => {
        console.error("Failed to delete dashboard" + error);
      });
  }

  showCheckMark() {
    console.log("it started");
    this.setState({ checkMark: "faIconFade" });
    setTimeout(() => this.setState({ checkMark: "faIcon" }), 3000);
    console.log("it finished");
  }

  render() {
    let dashBoardData = this.props.dashBoardData;
    let savedDashBoards = Object.keys(dashBoardData).map((el) => (
      <tr key={dashBoardData[el].id + "tr"}>
        <td className="centerTE">
          <button onClick={() => this.deleteDashBoard(dashBoardData[el].id)}>
            {/* <button onClick={() => this.props.loadDashBoard(el.globalStockList, el.widgetList)}> */}
            <i className="fa fa-times" aria-hidden="true"></i>
          </button>
        </td>
        <td key={dashBoardData[el].id + "te"}>{dashBoardData[el].dashBoardName}</td>
        <td className="centerTE">
          <button onClick={() => this.props.loadDashBoard(dashBoardData[el].globalStockList, dashBoardData[el].widgetList)}>
            <i className="fa fa-check-square-o" aria-hidden="true"></i>
          </button>
        </td>
      </tr>
    ));

    return (
      <div className="dashBoardMenu">
        <div>
          <table>
            <thead>
              <tr>
                <td className="centerTE">Remove</td>
                <td className="centerTE">Description</td>
                <td className="centerTE">Display</td>
              </tr>
            </thead>
            <tbody>
              {savedDashBoards.length > 0 ? (
                <>{savedDashBoards}</>
              ) : (
                <tr>
                  <td></td>
                  <td>"No previous saves"</td>
                  <td></td>
                </tr>
              )}
              <tr>
                <td className="centerTE">
                  <p className={this.state.checkMark}>
                    <i className="fa fa-check-circle" aria-hidden="true"></i>
                  </p>
                </td>
                <td>
                  <input type="text" value={this.state.inputText} onChange={this.handleChange}></input>
                </td>
                <td>
                  <input
                    className="btn"
                    type="submit"
                    value={this.props.currentDashBoard === this.state.inputText ? "Update" : " Save "}
                    // value="submit"
                    onClick={() => {
                      this.props.saveCurrentDashboard(this.state.inputText);
                      this.showCheckMark();
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
export default DashBoardMenu;