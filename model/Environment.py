from collections import defaultdict


class Environment:
    """ The mdp is for the skill acquisition mdp and with objective level environment of space ship travel.
    The space ship game environment has to be episodic, or else, it makes no sense, because one can't travel away
    from the destination"""

    def __init__(self, gamma):
        self.nS1 = 3
        self.nS2 = 26
        self.goal = 20
        self.gamma = gamma
        self.actions = [1, 2]
        self.nA = len(self.actions)
        self.total_distance = 10
        self.states = [(d, k1, k2)
                       for d in range(1, self.total_distance + 1)
                       for k1 in range(1, self.nS1 + 1)
                       for k2 in range(1, self.nS2 + 1)]

    # reset distance to the initial value when one episode ends
    def reset_distance(self):
        return self.total_distance

    # return the next states given current state
    def step(self, cur_state, action):

        d, k1, k2 = cur_state
        # if reaching the goal, d will be randomly set between [3, total_distance]

        next_states = defaultdict(list)  # key: next_state, values: transition_prob, reward

        # try skill 1
        if action == self.actions[0]:
            # if skill 1 is not acquired
            if k1 > 1:
                # if getting error trying skill 1, the position in the objective mdp does not change
                # and reward = -1
                reward = -1

                next_state = (1.0 - (1.0 / k1), reward)
                next_states[(d, k1 - 1, k2)].append(next_state)
                # print(f"next_state with action k1: {d, k1-1, k2}")

                # if getting the skill 1, the player move one step further in obj-mdp, and get reward -1 if
                # he's not reached the goal
                d -= 1
                if d == 0:
                    reward = self.goal - 1
                    # reset the game environment
                    d = self.reset_distance()
                if (d, 1, k2) in next_states:
                    next_states[(d, 1, k2)].append((1.0 / k1, reward))
                else:
                    next_states[(d, 1, k2)] = [(1.0 / k1, reward)]

                # print(f"next_state with action k1: {d, 1, k2}")

            # if skill 1 is acquired
            else:
                assert k1 == 1

                d -= 1
                if d <= 0:
                    reward = self.goal - 1
                    # reset the game environment
                    d = self.reset_distance()

                else:
                    reward = -1
                next_states[(d, 1, k2)] = [(1, reward)]
                # print(f"next_state with action k1: {d, 1, k2}")

        elif action == self.actions[1]:
            # if skill 2 is not acquired
            if k2 > 1:
                # if getting error when trying skill 2, the player would get reward -1
                reward = -1
                if (d, k1, k2 - 1) in next_states:
                    next_states[(d, k1, k2 - 1)].append((1.0 - (1.0 / k2), reward))
                else:
                    next_states[(d, k1, k2 - 1)] = [(1.0 - (1.0 / k2), reward)]
                # print(f"next_state with action k2: {d, k1, k2-1}")

                # if getting the right key of skill 2, the player would get reward goal - 1
                # and reaching the destination.
                reward = self.goal - 1

                # d will be reset to the value of total_distance, game reset
                d = self.reset_distance()

                if (d, k1, 1) in next_states:
                    next_states[(d, k1, 1)].append((1.0 / k2, reward))
                else:
                    next_states[(d, k1, 1)] = [(1.0 / k2, reward)]
                # print(f"next_state with action k2: {d, k1, 1}")

            # if skill 2 is already acquired
            else:
                reward = self.goal - 1

                # d will be reset to a random n and total_distance, game reset
                d = self.reset_distance()
                next_states[(d, k1, 1)] = [(1, reward)]

        return next_states
