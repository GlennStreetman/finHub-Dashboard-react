import React from "react";
import {widgetLookUp} from '../registers/widgetContainerReg.js'
import {excelRegister, excelRegister_singleSecurity} from '../registers/excelButtonRegister'
import ToolTip from './../components/toolTip.js'
import ErrorBoundary from './widgetErrorBoundary';

//creates widget container. Used by all widgets.
class WidgetContainer extends React.Component {
constructor(props) {
    super(props);
    this.state = {
    renderHeader: this.props.widgetList["widgetHeader"],
    renderBody: this.props.widgetList["widgetType"],
    showEditPane: 0, //0: Hide, 1: Show
    show: 'block', //block = visable, none = hidden
    searchText: '',
    };

    this.widgetRef = React.createRef();
    this.dragElement = this.dragElement.bind(this);
    this.showPane = this.showPane.bind(this);
    this.updateHeader = this.updateHeader.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.showWidget = this.showWidget.bind(this); //updates show.
    this.changeSearchText = this.changeSearchText.bind(this);
}

componentDidMount(){
const visable = this.showWidget()
this.setState({show: visable})
}

componentDidUpdate(prevProps) {
    const p = this.props
    if (p.widgetLockDown !== prevProps.widgetLockDown) {
    this.setState({ showEditPane: 0 });
    }
    if (p.stateRef !== prevProps.stateRef || 
        p.showMenu !== prevProps.showMenu || 
        p.showStockWidgets !== prevProps.showStockWidgets) {
        const visable = this.showWidget()
        this.setState({show: visable})
    }
}

changeSearchText(text) {
    if (text !== '' && text !== undefined) { 
    this.setState({searchText: text})
    }
}

showPane(stateRef, fixState = -1) {
    let showMenu = this.state[stateRef] === 0 ? 1 : 0;
    fixState !== -1 && (showMenu = fixState);
    this.setState({ [stateRef]: showMenu });
}

updateHeader(e) {//changes widget name.
    this.setState({ renderHeader: e.target.value });
    if (this.props.stateRef === "stockWidget" || this.props.stateRef === 'marketWidget') {
    this.props.changeWidgetName('widgetList', this.props.widgetKey, e.target.value);
    } else{
    this.props.changeWidgetName('menuList', this.props.widgetKey, e.target.value);
    }
}

handleChange(e) {
    this.setState({ renderHeader: e.target.value });
}

dragElement() {
    const widgetState = this.widgetRef.current;
    if (widgetState.state === undefined) {widgetState.state = {}}
    widgetState.state.widgetID = this.props.widgetList.widgetID
    let that = this;
    let xAxis = 0;
    let yAxis = 0;

    document.getElementById(this.props.widgetList["widgetID"]).onmousedown = dragMouseDown;
    // let widgetWidth = document.getElementById(this.props.widgetKey + "box").clientWidth;
    let widgetWidth = 200

    function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    xAxis = e.clientX + window.scrollX
    yAxis = e.clientY 
    that.props.setDrag(that.props.stateRef, that.props.widgetKey, widgetState.state)
    .then((data)=>{
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    })
    }

    function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();

    xAxis = e.clientX + window.scrollX;
    yAxis = e.clientY + window.scrollY;
    
    let newX = xAxis - widgetWidth + 25 >= 5 ? xAxis - widgetWidth + 25 : 5
    let newY = yAxis - 25 >= 60 ? yAxis - 25 : 60
    //copy widget state THEN move widget.
    that.props.moveWidget(that.props.stateRef, that.props.widgetKey, newX, newY);
    }

    function closeDragElement(e) {
    // stop moving when mouse button is released:
    xAxis = e.clientX + window.scrollX;
    yAxis = e.clientY + window.scrollY;
    let newX = xAxis - widgetWidth + 25 >= 5 ? xAxis - widgetWidth + 25 : 5
    let newY = yAxis - 25 >= 60 ? yAxis - 25 : 60
    const snapWidget = () => {
        that.props.snapWidget(that.props.widgetList['widgetConfig'], that.props.widgetKey, xAxis, yAxis)
    }
    document.onmouseup = null;
    document.onmousemove = null;
    that.props.moveWidget(that.props.stateRef, that.props.widgetKey, newX, newY, snapWidget);

    }
}

showWidget(){
    if (this.props.stateRef === "menuWidget" && this.props.showMenu === 0){
    return "none"
    } else if (this.props.showStockWidgets === 0) {
    return "none"
    } else { 
    return "block"
    }
}

render() {
    console.log('render-------------->', this.props.widgetList["widgetType"])
    const that = this;
    const hideStockSearchMenu = ["dashBoardMenu"] //consider moving this to its own register.
    const compStyle = {
    display: this.state.show
    };


    const visStatus = this.props.widgetList.showBody || this.props.stateRef === 'menuWidget' ? 'block' : 'none'
    const bodyVisable = {
        display: visStatus,
    }
    const excelFunction = excelRegister[this.props.widgetList.widgetType]

    if (that.props.widgetList.column === 'drag'){ 
    compStyle['position'] = 'absolute'
    compStyle['top'] = this.props.widgetList["yAxis"]
    compStyle['left'] = this.props.widgetList["xAxis"] 
    } 
    let widgetProps = that.props.widgetBodyProps ? that.props.widgetBodyProps() : {}
    if (this.props.widgetKey !== "dashBoardMenu") {
    widgetProps["showEditPane"] = that.state.showEditPane;
    widgetProps["showPane"] = that.showPane;
    widgetProps['searchText'] = this.state.searchText
    widgetProps['changeSearchText'] = this.changeSearchText
    widgetProps['updateAPIFlag'] = this.props.updateAPIFlag
    widgetProps['widgetType'] = this.props.widgetList["widgetType"]
    widgetProps['config'] = this.props.widgetList.config
    widgetProps['updateDashBoards'] = this.props.updateDashBoards
    widgetProps['finnHubQueue'] = this.props.finnHubQueue
    } 
    if (this.props.widgetCopy) {
    widgetProps['widgetCopy'] = this.props.widgetCopy
    }
    const myRef = this.widgetRef
    return (
    <div 
        key={this.props.widgetKey + "container" + that.props.widgetList.column} 
        id={this.props.widgetKey + "box"} 
        style={compStyle} 
        className="widgetBox"  
    >
        {this.props.widgetLockDown === 0 ? (
        <div className="widgetHeader">
            {this.state.showEditPane === 0 ? (
            <>
                {widgetProps['helpText'] !== undefined && <ToolTip textFragment={widgetProps['helpText'][0]} hintName={widgetProps['helpText'][1]} />}
                {this.state.renderHeader}
            </>
            ) : (
            <input type="text" id={this.props.widgetKey + "HeaderValue"} value={this.state.renderHeader} onChange={this.updateHeader} />
            )}

            <button
            className="headerButtons"
            id={this.props.widgetList["widgetID"]}
            onMouseOver={() => {
                this.dragElement();
            }}
            >
            <i className="fa fa-arrows" aria-hidden="true"></i>
            </button>
            {hideStockSearchMenu.indexOf(this.props.widgetKey) < 0 && (
            <>
                {this.props.stateRef !== 'menuWidget' ?
                <button  
                    className="headerButtons" 
                    onClick={() => {this.props.toggleWidgetBody(this.props.widgetKey)}
                }>
                {this.props.widgetList.showBody !== false ? <i className="fa fa-caret-square-o-right" aria-hidden="true" /> : <i className="fa fa-caret-square-o-down" aria-hidden="true" />}
                </button> : <></>}

                <button data-testid={`editPaneButton-${this.props.widgetList["widgetType"]}`} className="headerButtons" onClick={() => {this.showPane("showEditPane", -1)}}>
                <i className="fa fa-pencil-square-o" aria-hidden="true" />
                </button>
            </>
            )}
        </div>
        ) : (
        <div className="widgetHeader">{this.state.renderHeader}</div>
        )}
        <div className='widgetBody' style={bodyVisable} key={this.props.showBody}>

        <ErrorBoundary widgetType={this.props.widgetList["widgetType"]}>
        {React.createElement(widgetLookUp[this.props.widgetList["widgetType"]], {ref: myRef, ...widgetProps })}
        </ErrorBoundary> 
        </div>

        <div className="widgetFooter">
        {this.props.widgetList.showBody !== false && this.state.showEditPane === 1 && (
                <button
                onClick={() => {
                    if (this.props.stateRef === "stockWidget" || this.props.stateRef === 'marketWidget') {
                    this.props.removeWidget("widgetList", this.props.widgetKey);
                    } else {
                    this.props.menuWidgetToggle(this.props.widgetKey);
                    }
                }}
                >
                <i className="fa fa-times" aria-hidden="true" data-testid={`removeWidget-${this.props.widgetList["widgetType"]}`}></i>
                </button>
        )}

        {this.props.widgetList.showBody !== false && this.state.showEditPane !== 1 && (

            excelRegister_singleSecurity[this.props.widgetList.widgetType] && ( //button returns data for target securities associated with widget.
                <button onClick={()=>excelFunction(this.props.apiKey, this.props.currentDashBoard, this.props.widgetList.widgetHeader, this.props.widgetList.config.targetSecurity, this.props.widgetList.config)}>
                    <i className="fa fa-file-excel-o" aria-hidden="true" data-testid={`excelButton-${this.props.widgetList["widgetType"]}`}></i>
                </button>
            )
        )}

        {this.props.widgetList.showBody !== false && this.state.showEditPane !== 1 && (

            excelRegister[this.props.widgetList.widgetType] && ( //button returns data for all securities associated with widget.
                <button onClick={()=>excelFunction(this.props.apiKey, this.props.currentDashBoard, this.props.widgetList.widgetHeader,false,this.props.widgetList.config)}>
                    <i className="fa fa-list" aria-hidden="true" data-testid={`excelButton-${this.props.widgetList["widgetType"]}`}></i>
                </button>
            )
        )}
        </div>
    </div>
    );
}
}

export default WidgetContainer;

