'use strict';


var Link = window.ReactRouterDOM.Link
var HashRouter = window.ReactRouterDOM.HashRouter
var Switch = window.ReactRouterDOM.Switch
var Route = window.ReactRouterDOM.Route
var Redirect = window.ReactRouterDOM.Redirect


var intro = introJs();

let brainPointIntroShown = false


class PseudoReward extends React.Component {
    render() {

        var brainPointAlerted = localStorage.getItem('brainPointAlerted') || ''


        console.log("cur val of state " + this.props.current_distance + this.prop)

        var a = Math.round(
            (this.props.gamma *
            Q[
            "(" +
            this.props.current_distance +
            ", " +
            this.props.current_k1 +
            ", " +
            this.props.current_k2 +
            ", " +
            this.props.skillTried +
            ")"
                ] -
            V[
            "(" +
            this.props.previous_distance +
            ", " +
            this.props.previous_k1 +
            ", " +
            this.props.previous_k2 +
            ")"
                ]) * 100)/100,

            b = 0 <= a ? "+" + a : a;

        const c = 0 >= a ? "red" : "green";

        return React.createElement(
            "div",
            null,

            1 <= this.props.totalStep &&
            React.createElement(
                "p",
                {
                    style: {fontWeight: "bold", float: "right"},
                    // id: 'pr',
                },

                "Brain points for this step: ",
                React.createElement("span", { style: { color: c} }, " ", b),
                React.createElement(
                    "div",
                    null,
                    "expected action value at cur state (" +
                    this.props.current_distance +
                    ", " +
                    this.props.current_k1 +
                    ", " +
                    this.props.current_k2 +
                    ", " +
                    this.props.skillTried +
                    ") is :" +
                    Q[
                    "(" +
                    this.props.current_distance +
                    ", " +
                    this.props.current_k1 +
                    ", " +
                    this.props.current_k2 +
                    ", " +
                    this.props.skillTried +
                    ")"
                        ]
                ),
                React.createElement(
                    "div",
                    null,
                    "value at past state (" +
                    this.props.previous_distance +
                    ", " +
                    this.props.previous_k1 +
                    ", " +
                    this.props.previous_k2 +
                    ") is: " +
                    V[
                    "(" +
                    this.props.previous_distance +
                    ", " +
                    this.props.previous_k1 +
                    ", " +
                    this.props.previous_k2 +
                    ")"
                        ]

                ),

            )
        );
    }
}


class Square extends React.Component {
    render() {
        return React.createElement(
            "div",
            {
                className: "square",
                style: {
                    background: '#fff',
                    border: '1px solid #999',
                    float: 'left',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    lineHeight: '34px',
                    height: '34px',
                    marginRight: '-1px',
                    marginTop: '-1px',
                    padding: '0',
                    textAlign: 'center',
                    width: '34px',

                }
            },
            this.props.value
        );
    }
}


class Board extends React.Component {

    render() {
        const g = Array(6).fill().map(x => Array(6).fill());
        const board = g.map((row, i) => {
            return React.createElement(
                'tr',
                {key: "row_" + i},
                row.map((col, j) => {
                    // console.log([i, j]);
                    if (i === this.props.current_state_row && j === this.props.current_state_col) {
                        return React.createElement(Square, {value: 'X', key: "col_" + j});
                    } else if (i === this.props.end_state_row && j === this.props.end_state_col) {
                        return React.createElement(Square, {value: 'O', key: "col_" + j});
                    } else {
                        return React.createElement(Square, {value: '', key: "col_" + j});
                    }
                })
            );
        });

        return React.createElement(
            'div',
            {style: {textAlign: 'center', paddingLeft: '100px'}},
            React.createElement(
                'div',
                {style: {margin: 'auto', width: "40%"}},
                React.createElement(
                    'table',
                    {cellSpacing: '0', id:"board_table"},
                    React.createElement(
                        'tbody',
                        {id: "board_body"},
                        board
                    )
                )
            ),
            React.createElement('br', null)
        );
    }
}



class AddScore extends React.Component {
    render(){
        const scoreColor = this.props.score <= 0 ? "red": "green";

        return React.createElement(
            "div",
            {
                style: {
                    fontWeight: "bold",
                    height: "90px",
                    paddingLeft: '100px',
                    // float: "right"
                },
                id: 'score',
                className: 'col-xs-4'
            },
            React.createElement(
                "span",
                {
                    style: {
                        position: 'absolute',
                        bottom: '0',
                    }
                },
                "Your score is: ",
                React.createElement(
                    "span",
                    {
                        style: {
                            color: scoreColor,
                        }
                    },
                this.props.score
                ),
            ),

        );
    }
}



class GamePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentKey: '',
            current_state_row: null,
            current_state_col: null,
            end_state_row: null,
            end_state_col: null,
            teleportationKey: '',
            episode_win: null,
            step: null,
            round: null,
            score: null,
            goal: null,
            episode_interrupt: null,
            gamma: null,
            totalStep: null,
            crash: false,
            sidebarOpen: true,
            keyPressHist: [],

            current_distance: null,
            current_k1: null,
            current_k2: null,

            previous_distance: null,
            previous_k1: null,
            previous_k2: null,

            skillTried: null,

            stateValue: null,

            stateValueIncrease: null,
        };

        this.onSetSidebarOpen = this.onSetSidebarOpen.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.checkEpisodeWin = this.checkEpisodeWin.bind(this);
        this.checkGameStatus = this.checkGameStatus.bind(this);


    }

    onSetSidebarOpen(open) {
        this.setState({sidebarOpen: open});
    }

    checkEpisodeWin() {
        if (this.state.current_state_row === this.state.end_state_row
            && this.state.current_state_col === this.state.end_state_col) {
            return true;
        } else {
            return false;
        }
    }

    next_round_board() {
        this.setState({
            current_state_row: 5,
            current_state_col: 0,
            episode_win: false,
            step: 0,
            round: this.state.round + 1,
            current_distance: 10,
        });
    }

    checkCrash() {
        const crashRate = Math.round((1 - this.state.gamma) * 100) / 100;
        if (Math.random() < crashRate) {

            this.setState({
                crash: true
            });
        }
    }



    handleKeyPress(e) {

        if (this.state.keyPressHist.includes(e.key)
            && (e.key !== "ArrowRight"
                && e.key !== "ArrowUp"
                && e.key !== this.state.teleportationKey)){
            alert("You have already pressed the wrong key: " + e.key)
        }

        if (e.key === "ArrowRight"
            || e.key === "ArrowUp"
            || e.key === this.state.teleportationKey
            || ((97 <= e.key.charCodeAt(0)
                    && e.key.charCodeAt(0) <= 122
                    || e.key === "ArrowLeft"
                    || e.key === "ArrowDown"
                )
                && !this.state.keyPressHist.includes(e.key))) {

            var rt = new Date().getTime()



            if (this.state.totalStep >= 0) {
                this.checkCrash();
            }

            var prevScore

            this.setState(previousState =>{
                prevScore = previousState.score
            })

            console.log(e.key.charCodeAt(0));
            console.log(e.key);

            // console.log(this.state)
            console.log(this)


            this.setState({
                currentKey: e.key,
                step: this.state.step + 1,
                score: this.state.score - 1,
                totalStep: this.state.totalStep + 1
            });

            if (e.key === "ArrowUp"
                || e.key === "ArrowDown"
                || e.key === "ArrowLeft"
                || e.key === "ArrowRight"){
                this.setState({
                    skillTried: 1
                })
            }else {
                this.setState({
                    skillTried: 2
                })
            }

            this.setState(previousState => ({
                keyPressHist: [...previousState.keyPressHist, e.key],
                previous_distance: previousState.current_distance,
                previous_k1: previousState.current_k1,
                previous_k2: previousState.current_k2,
            }));


            if (e.key === "ArrowRight") {
                if (this.state.current_state_col + 1 <= 5) {
                    this.setState({
                        current_state_col: this.state.current_state_col + 1,
                        current_k1: 1,
                    });

                    if (this.state.current_distance >= 2){
                        this.setState({
                            current_distance: this.state.current_distance - 1
                        })
                    }

                }

                this.checkGameStatus();

            } else if (e.key === "ArrowUp") {
                if (this.state.current_state_row - 1 >= 0) {
                    this.setState({
                        current_state_row: this.state.current_state_row - 1
                    });

                    if (this.state.current_distance >= 2){
                        this.setState({
                            current_distance: this.state.current_distance - 1,
                        })
                    }

                }
                this.checkGameStatus();

            } else if (e.key === this.state.teleportationKey) {
                this.setState({
                    current_state_row: this.state.end_state_row,
                    current_state_col: this.state.end_state_col,
                    episode_win: true,
                    // score: this.state.score + this.state.goal,
                    current_distance: 10,
                    current_k2: 1,

                });
                // TODO: freeze the function of steps count
                this.checkGameStatus();

            } else {

                if (!this.state.crash) {
                    //update the value state if tried wrong keys
                    if (e.key === "ArrowLeft" || e.key === "ArrowDown"){
                        alert("you want to turn away from the destination? No way!!")
                        if (this.state.current_k1 !== 1){
                            this.setState({
                                current_k1: this.state.current_k1 - 1,
                            })
                        }

                    }else if(97 <= e.key.charCodeAt(0) &&
                        e.key.charCodeAt(0) <= 122){
                        if (this.state.current_k2 !== 1){
                            this.setState({
                                current_k2: this.state.current_k2 - 1,
                            })
                        }
                    }

                }
            }


            let a = this.state.gamma *
                    Q[
                    "(" +
                    this.state.current_distance +
                    ", " +
                    this.state.current_k1 +
                    ", " +
                    this.state.current_k2 +
                    ", " +
                    this.state.skillTried +
                    ")"
                        ] -
                    V[
                    "(" +
                    this.state.previous_distance +
                    ", " +
                    this.state.previous_k1 +
                    ", " +
                    this.state.previous_k2 +
                    ")"
                        ]

            let prevStateValue

            this.setState(previousState =>{
                prevStateValue =  previousState.stateValue
            })

            this.setState(previousState => (
                {
                    stateValue: previousState.stateValue + a
                }
            ))

            // calculate the cur and prev state value to retrieve the increment or decrement of the values and save it
            // in the stateValueIncrease state
            this.setState(() => {
                let currentStateVal = Math.round(parseFloat(this.state.stateValue) + parseFloat(this.state.score))
                let prevStateVal = Math.round(parseFloat(prevStateValue) + parseFloat(prevScore))
                console.log( 'curr State: ' + currentStateVal + ' prev State: ' + prevStateVal)
                if(!isNaN(prevStateVal)) {
                    if (currentStateVal >= prevStateVal) {
                        return {stateValueIncrease: true}

                    } else {
                        return {stateValueIncrease: false}
                    }
                }else{
                    if (currentStateVal >= 0){
                        return {stateValueIncrease: true}
                    }else {
                        return {stateValueIncrease: false}
                    }
                }
                }
            )


            if (psiTurk.taskdata.get('condition') === 1){
                console.log('into brain sound')
                if(this.state.stateValueIncrease){
                    document.getElementById('positive_brain_sound').load()
                    document.getElementById('positive_brain_sound').play()


                }else{
                    document.getElementById('negative_brain_sound').load()
                    document.getElementById('negative_brain_sound').play()

                }

            }


            psiTurk.recordTrialData({
                'phase':"TEST",
                'condition': psiTurk.taskdata.get('condition'),
                "keypressed": this.state.currentKey,
                "skillTried": this.state.skillTried,
                "currentDistance": this.state.current_distance,
                "currentK1": this.state.current_k1,
                "currentK2": this.state.current_k2,
                "totalStep": this.state.totalStep,
                "round": this.state.round,
                "score": this.state.score,
                "rt": rt,
            })

            // this.state.crash && React.createElement(Redirect, {to: "/gameOver"})
            if (this.state.crash){
                new Questionnaire()
            }
        }

    }


    startIntro(){

        intro.setOptions({
            steps: [
                {
                    element: '#ins1',
                    intro: "The control for moving the spaceship in the newtonian way is embedded in " +
                        "one of the highlighted arrow keys: \n " +
                        "<img src=\"/static/images/us_keyboard_select_arrows.png\" " +
                        "alt=\"skill 1 keyboard\" width='700'>\n",
                    position: 'bottom'
                },
                {
                    element: '#ins2',
                    intro: "The control for teleporting the spaceship is embedded in " +
                        "one of the highlighted letter keys\n " +
                        "<img src='/static/images/us_keyboard_select_letters.png' " +
                        "alt='skill 2 keyboard' width='700'>",
                    position: 'bottom'
                },
                {
                    element: '#board_table',
                    intro: "This is the main game board, the <strong>X</strong> symbol is your spaceship and " +
                        "the <strong>O</strong> symbol is the destination planet.",
                    position: 'left'
                },
                {
                    element: '#score',
                    intro: "You will get <strong>-1 score</strong> for each step you make, " +
                        "and <strong>+20 scores</strong> for reaching the destination",
                },

            ],
            keyboardNavigation: false,
        });
        intro.start();

        intro.onexit(()=> {
            console.log('exit the intro tour')
            document.addEventListener("keydown", this.handleKeyPress)})
    }


    checkGameStatus() {

            if (this.checkEpisodeWin()) {
                this.setState({
                    episode_win: true,
                    score: this.state.score + this.state.goal
                });
                document.getElementById('positive_sound').play();

                swal("Congrats, you reach the destination! ",
                    "You found another better planet, start a new journey now!",  "success")

                this.next_round_board()

            } else {
                if (!this.state.crash) {
                    // document.getElementById('negative_sound').play();
                }
            }
        // }

    }

    gameStatus() {
        return React.createElement(
            'p',
            null,
            'Step ',
            this.state.step,
            ' / Round ',
            this.state.round
        );
    }

    componentDidMount() {

        localStorage.clear()


        const max_distance = 10
        const max_k1 = 3
        const max_k2 = 26

        var possible = "abcdefghijklmnopqrstuvwxyz";

        this.setState({
            current_state_row: 5,
            current_state_col: 0,
            end_state_row: 0,
            end_state_col: 5,
            // teleportationKey: "p",
            teleportationKey: possible.charAt(Math.floor(Math.random() * possible.length)),
            episode_win: false,
            step: 0,
            round: 1,
            goal: 20,
            score: 0,
            gamma: 0.94,
            totalStep: 0,
            crash: false,
            sidebarOpen: false,

            current_distance: max_distance,
            current_k1: max_k1,
            current_k2: max_k2,

            previous_distance: null,
            previous_k1: null,
            previous_k2: null,

            skillTried: null,
            stateValue: null,
            stateValueIncrease: null,
        });

        this.startIntro()


        console.log('componentDidMount executed!!')

    }


    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyPress);
        localStorage.clear()
    }


    render() {
        const title = "Spaceship Adventure";
        const instruction1 = "To move the spaceship in the newtonian way, " +
            "try arrow keys. Hint: The Arrow-Up key moves your spaceship up."

        const instruction2 = "To teleport the spaceship, " +
            "find the correct key on your keyboard among the 26 letter keys"

        // status: step and round information
        const status = this.gameStatus();

        let totalPr = Math.round(parseFloat(this.state.stateValue) + parseFloat(this.state.score))


        const c = 0 >= totalPr ? "red" : "green"

        const condition = "Condition: "+ psiTurk.taskdata.get('condition')

        const brainImage = this.state.stateValueIncrease? '/static/images/brain_green.png' : '/static/images/brain_red.png'


        console.log("get into layout render");

        console.log('this.state.step:')
        console.log(this.state.step)

        console.log('this:')
        console.log(this)




        if (document.getElementById("pr") != null && !brainPointIntroShown) {
            console.log("into intro tour brain point refresh")
            intro.setOptions({
                steps: [
                    {
                        element: '#pr',
                        intro: 'Valuable skills are often difficult to learn and ' +
                            'we give you brain points to encourage you to learn that.'
                    }
                ],
                keyboardNavigation: false
            }).start()

            brainPointIntroShown = true
        }

        return React.createElement(
            'div',
            null,

            React.createElement(
                'hr'
            ),

            React.createElement(
                'div',
                {
                    style: {
                        marginLeft: '50px',
                        marginRight: '50px',
                        height: '100px',
                    }
                },

                React.createElement(
                    AddScore,
                    {
                        score: this.state.score,
                    }
                ),

                (psiTurk.taskdata.get('condition') === 1) &&
                1 <= this.state.totalStep &&
                React.createElement(
                    "div",
                    {
                        style: {
                            fontWeight: "bold",
                            float: "right",
                            height: '90px',
                        },
                        id: 'pr',
                        className: 'col-xs-4'
                    },
                    React.createElement(
                        "img",
                        {
                            src: brainImage,
                            height: '70px',
                            float: 'right',
                        }
                    ),

                    React.createElement(
                        'div',
                        {className: 'w-100'}
                    ),

                    React.createElement(
                        "p",
                        {
                            style: {
                                color: c,
                            },

                        },
                        "Brain points: ",
                        totalPr
                    )
                ),


            ),



            React.createElement(
                'hr'
            ),

            React.createElement(
                'p',
                {style: {marginLeft: '50px', marginRight: '50px'}, className: 'instructions well', id: 'ins1'},
                instruction1
            ),

            React.createElement(
                'p',
                {style: {marginLeft: '50px', marginRight: '50px'}, className: 'instructions well', id:'ins2'},
                instruction2
            ),

            React.createElement(
                'div',
                {style: {marginLeft: '50px', marginRight: '50px'}, className: 'game_status'},
                status
            ),

            React.createElement(
                'p',
                {style: {marginLeft: '50px', marginRight: '50px'}},
                'Your total step: ',
                this.state.totalStep
            ),

            React.createElement(
                'p',
                {style: {marginLeft: '50px', marginRight: '50px'}},
                'There is a ',
                Math.round((1 - this.state.gamma) * 100),
                ' percent probability that your spaceship will crash in the next step!'
            ),

            React.createElement(
                Board,
                {
                    current_state_row: this.state.current_state_row,
                    current_state_col: this.state.current_state_col,
                    end_state_row: this.state.end_state_row,
                    end_state_col: this.state.end_state_col,

                    id: "board",
                }
            ),


            React.createElement(
                'p',
                {style: {marginLeft: '50px', marginRight: '50px'}},
                'The key(s) you pressed: ',
                this.state.currentKey
            ),
            React.createElement(
                'audio',
                {id: "negative_sound",
                    src: "/static/media/negative_sound.mp3"}
            ),
            React.createElement(
                'audio',
                {id: "positive_sound",
                    src: "/static/media/positive_sound.mp3"}
            ),
            React.createElement(
                'audio',
                {id: "negative_brain_sound",
                    src: "/static/media/negative_brain_sound.mp3"}
            ),
            React.createElement(
                'audio',
                {id: "positive_brain_sound",
                    src: "/static/media/positive_brain_sound.mp3"}
            ),

        );
    }
}


class IntroPage extends React.Component {
    render(){

        console.log("IntroPage render")
        return React.createElement(
            "div",
            { className: "App" ,
                style: {
                    textAlign: "center",

    }
            },
            React.createElement(
                "header",
                { className: "App-header",
                style:{

                    backgroundColor: "#282c34",
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "calc(10px + 2vmin)",
                    color: "white",
                }},
                React.createElement("img", {
                    src: "/static/images/spaceship.svg",
                    className: "App-logo",
                    style: {

                        animation: "{AppLogoSpin} infinite 20s linear",
                        height: "40vmin"
                    },
                    alt: "logo"
                }),
                React.createElement("div",
                    { className: "empty_space",
                        style: {
                            height: "100px"

                        },
                    },

                    " "),
                React.createElement(
                    Link,
                    { to: "/main", className: "link", style:{  color: "aliceblue"
    } },
                    "Enter Spaceship game"
                )
            )
        );
    }
}





let domContainer = document.getElementById('root');
ReactDOM.render(React.createElement(GamePage, null), domContainer);

