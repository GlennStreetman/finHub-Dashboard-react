import React from "react";
import CanvasJSReact from "../../../canvasjs.react";

export default class RecTrendChart extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    let CanvasJSChart = CanvasJSReact.CanvasJSChart;
    let options = this.props.chartOptions;
    return (
      <div data-testid={`chart-${this.props.targetSecurity}`}>
        {this.props.chartOptions !== undefined && <CanvasJSChart options={options} onRef={(ref) => (this.chart = ref)} />}
      </div>
    );

    /*You can get reference to the chart instance as shown above using onRef. This allows you to access all chart properties and methods*/
  }
}  
