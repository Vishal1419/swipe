import React, { Component } from 'react';
import { Animated, LayoutAnimation, PanResponder, Dimensions, UIManager, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

class Deck extends Component {

    static defaultProps = {
        onSwipeLeft: () => {},
        onSwipeRight: () => {}
    }

    constructor(props) {
        super(props);

        const position = new Animated.ValueXY();
        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy });
            },
            onPanResponderRelease: (event, gesture) => {
                //spring back to the original position after dragging is over.
                if (gesture.dx > SWIPE_THRESHHOLD) {
                    this.forceSwipe('right');
                } else if (gesture.dx < -SWIPE_THRESHHOLD) {
                    this.forceSwipe('left');
                } else {
                    this.resetPosition();
                }
            }
        });

        this.state = { panResponder, position, index: 0 };

    }

    forceSwipe(direction) {
        const x_val = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;

        Animated.timing(
            this.state.position, 
            { 
                toValue: { x: x_val, y: 0 },
                duration: SWIPE_OUT_DURATION
            }
        ).start(() => this.onSwipeComplete(direction));
    }

    onSwipeComplete(direction) {
        const { onSwipeLeft, onSwipeRight, data } = this.props;
        const item = data[this.state.index];
        direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
        this.state.position.setValue({ x: 0, y: 0 });
        this.setState({ index: this.state.index + 1 });
    }

    resetPosition() {
        Animated.spring(
            this.state.position, 
            { toValue: { x: 0, y: 0 } }
        ).start();
    }

    getCardStyle() {
        const { position } = this.state;
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
            outputRange: ['-120deg', '0deg', '120deg']
        });

        return {
            ...position.getLayout(),
            transform: [{ rotate }]
        };
    }

    renderCards() {

        if (this.state.index >= this.props.data.length) {
            console.log(this.props.renderNoMoreCards);
            return this.props.renderNoMoreCards();
        }

        return this.props.data.map((item, index) => {

            if (index < this.state.index) {
                return null;
            } else if (index === this.state.index) {
                return (
                    <Animated.View key={item.id} {...this.state.panResponder.panHandlers} style={[this.getCardStyle(), styles.cardStyle]} >
                        {this.props.renderCard(item)}
                    </Animated.View>
                );
            }

            return (
                <Animated.View key={item.id} style={[styles.cardStyle, { top: 10 * (index - this.state.index) }]} >
                    {this.props.renderCard(item)}
                </Animated.View>
            );
        }).reverse();
    }

    componentWillReceiveProps(newProps) {
        if (newProps.data !== this.props.data) {
            this.setState({ index: 0 });
        }
    }

    componentWillUpdate() {
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
        LayoutAnimation.spring();
    }

    render() {
        return (
            <View>
                {this.renderCards()}
            </View>
        );
    }
}

const styles = {
    cardStyle: {
        position: 'absolute',
        width: SCREEN_WIDTH
    }
};

export default Deck;
