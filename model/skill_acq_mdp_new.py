import numpy as np
import matplotlib.pyplot as plt
import json

import seaborn as sns

from scipy.interpolate import interpolate

from Environment import Environment


# return the converged value function of given policy
def policy_evaluation(policy, env):
    gamma = env.gamma
    states = env.states
    actions = env.actions
    V = {state: 0 for state in states}

    iteration = 0

    while True:

        delta = 0

        for state in states:
            d, k1, k2 = state

            v = 0

            for action, action_prob in enumerate(policy[(d, k1, k2)]):

                next_states = env.step((d, k1, k2), actions[action])

                for next_state, values in next_states.items():
                    # iterate all the values saved in one next state, in case there are more than 1 value tuples
                    for value in values:

                        state_prob, reward = value
                        v += action_prob * state_prob * (reward + gamma * V[next_state])

            delta = max(delta, np.abs(V[state] - v))
            V[state] = v

        iteration += 1

        if delta < 1e-4:
            break
    return V


# return the expected action values of the current state as an array
def one_step_lookahead(state, V, env):
    gamma = env.gamma
    actions = env.actions
    A = np.zeros(len(actions))

    for action in range(len(A)):
        next_states = env.step(state, actions[action])
        for next_state, values in next_states.items():
            for value in values:
                state_prob, reward = value
                A[action] += state_prob * (reward + gamma * V[next_state])
    return A


# return the optimal policy and optimal state value
def policy_iteration(env):
    actions = env.actions
    states = env.states

    policy = {state: np.ones(len(actions)) / len(actions) for state in states}

    while True:

        V = policy_evaluation(policy, env)

        policy_stable = True
        policy_change = 0

        for state in states:
            d, k1, k2 = state

            chosen_a = np.argmax(policy[(d, k1, k2)])
            action_values = one_step_lookahead((d, k1, k2), V, env)
            # print(f"action_values at state{d, k1, k2}: {action_values}")
            best_action = np.argmax(action_values)
            # print(f"best_action at state {d, k1, k2}: {best_action}")
            if best_action != chosen_a:
                policy_change += 1
                policy_stable = False
            policy[state] = np.eye(len(actions))[best_action]
        print("policy change in {} states".format(policy_change))

        if policy_stable:
            return policy, V


# this method is used to validate the result retrieved from the policy evaluation and policy iteration method
def value_iteration(env, gamma, theta=1e-4):

    def one_step_lookahead(state, V):
        A = np.zeros(env.nA)
        for a in range(env.nA):
            next_states = env.step(state, env.actions[a])
            for next_state, values in next_states.items():
                for value in values:
                    state_prob, reward = value
                    A[a] += state_prob * (reward + gamma * V[next_state])
        return A

    V = {state: 0 for state in env.states}

    while True:
        delta = 0
        for state in env.states:
            A = one_step_lookahead(state, V)
            best_action_value = np.max(A)
            delta = max(delta, np.abs(best_action_value - V[state]))
            V[state] = best_action_value
        if delta < theta:
            break

    policy = {state: np.ones(env.nA) / env.nA for state in env.states}

    for state in env.states:
        A = one_step_lookahead(state, V)
        best_action = np.argmax(A)
        policy[state] = np.eye(env.nA)[best_action]

    return policy, V


# compute the action value of using skill 2 analytically
def my_formula_vop(env):
    gamma = env.gamma
    g = env.goal
    states = env.states

    my_vop = {}
    for state in states:
        d, k1, k2 = state
        v = 0

        if k2 > 1:
            for i in range(1, k2):
                m = 1
                for j in range(i):
                    m *= (1.0 - (1.0 / (k2 - j)))
                v += np.power(gamma, i) * \
                     ((-k2 + i + k2 * gamma - i * gamma - gamma + g) / ((k2 - i) * (1.0 - gamma))) * m
            my_vop[(d, k1, k2)] = v + (g - 1.0) / (k2 * (1.0 - gamma)) - 1.0 + 1.0 / k2

        else:
            assert k2 == 1
            my_vop[(d, k1, k2)] = (g - 1.0) / (k2 * (1.0 - gamma)) - 1.0 + 1.0 / k2

    return my_vop


# the value of practice formula used in the paper
def paper_formula_vop(env, V):
    gamma = env.gamma
    g = env.goal
    states = env.states

    paper_vop = {}
    for state in states:
        d, k1, k2 = state
        if k2 > 1:
            _a = (1 / k2) * ((g - 1) + gamma * V[(d, 1, 1)])
            _b = (1 - (1 / k2)) * (-1 + gamma * V[(d, 1, k2 - 1)])
            v_stop_learning = g * (gamma ** (d - 1) / (1 - gamma ** d)) - (1 / (1 - gamma))
            _v = _a + _b - v_stop_learning
            paper_vop[(d, k1, k2)] = _v

    return paper_vop


# plot the analytical results of skill values and
# the result from the dynamic programming solutions of the given environment
def plot_comparison_vop_dp(env, my_vop, optimal_V, states, total_distance):
    fig, axs = plt.subplots()
    y1 = []
    y2 = []
    y3 = []
    for state in states:
        d, k1, k2 = state
        if d == total_distance and k1 == 1 and k2 > 1:
            action_values = one_step_lookahead(state, optimal_V, env)
            # print(f"optimal_v at state{d, k1, k2}: {optimal_V[(d, k1, k2)]}")
            print("action_values at state ({}, {}, {}): {}".format(d, k1, k2, action_values))
            # print(f"vop at state{d, k1, k2}: {Vop[(d, k1, k2)]}")
            print("my_vop at state ({}, {}, {}): {}".format(d, k1, k2, my_vop[(d, k1, k2)]))
            print("\n")
            y1.append(optimal_V[state])
            y2.append(action_values[1])
            y3.append(my_vop[state])
    assert len(y2) == len(y3)
    axs.plot([np.min(y2), np.max(y2)], [np.min(y2), np.max(y2)], ls=':')
    axs.scatter(y2, y3, label="action values of k2", alpha=0.5)
    axs.set_xlabel("Action states value DP:(d={}, k1={}, k2=(1, ... 26))".format(d, k1))
    axs.set_ylabel("New VOP state value : (d={}, k1={}, k2=(1, ... 26))".format(d, k1))
    plt.title("Comparison of vop and optimal state value from DP")
    plt.legend(loc="upper left")
    plt.show()


# run one roll out of the game from the current state until the spaceship crashes
def roll_out(current_state, env, initial_state, policy, time_steps, crash_at, survival_at):
    actions = env.actions
    gamma = env.gamma
    cumulative_return = 0
    cumulative_return_list = []
    stepwise_return = []
    action_list = []

    for i in range(time_steps):
        action = int(np.argmax(policy[current_state]))
        action_list.append(action)
        # print(f"actions taken for current state {current_state}: {action}")
        next_states = env.step(current_state, actions[action])
        # values_list returns (state prob, reward, next state)
        values_list = []

        # returns for the next step np, values contains state prob and reward
        for ns, values in next_states.items():
            # print(f"ns: {ns}, values: {values}")
            for value in values:
                values_list.append((value, ns))

        reward_list = [v[1] for v, _ in values_list]
        state_prob_list = [v[0] for v, _ in values_list]
        next_state_list = [next_state for _, next_state in values_list]

        # print(f"value_list: {values_list}")
        # print(f"reward_list: {reward_list}")
        # print(f"state_prob_list: {state_prob_list}")
        # print(f"next_state_list: {next_state_list}")

        assert len(reward_list) == len(values_list) == len(state_prob_list) == len(next_state_list)

        idx = np.random.choice(len(values_list), p=state_prob_list)
        chosen_reward = values_list[idx][0][1]
        stepwise_return.append(chosen_reward)
        cumulative_return += chosen_reward
        cumulative_return_list.append(cumulative_return)

        # print(f"chosen reward: {chosen_reward}")
        next_state = values_list[idx][1]

        if current_state == initial_state:
            current_state = next_state
            survival_at.append(i)
        else:
            crash = np.random.choice([True, False], p=[1.0 - gamma, gamma])
            if crash:
                crash_at.append(i)
                break
            else:
                current_state = next_state
                survival_at.append(i)

    return cumulative_return_list, stepwise_return, action_list


# return the results of simulating multiple participants doing the spaceship game
def simulation(env, policies, time_steps, participant_num):
    # simulation
    initial_state = (env.total_distance, env.nS1, env.nS2)
    current_state = initial_state
    fig, axs = plt.subplots(2, 2)
    best_scores = {}

    for policy_name, policy in policies.items():

        crash_at = []
        survival_at = []

        stepwise_return_arr = np.zeros((participant_num, time_steps))
        # save cumulative return of all participants in numpy array
        cumulative_return_arr = np.zeros((participant_num, time_steps))

        for j in range(participant_num):
            cumulative_return_list, stepwise_return, action_list = roll_out(current_state, env,
                                                                            initial_state, policy,
                                                                            time_steps, crash_at,
                                                                            survival_at)

            stepwise_return_arr[j, :len(stepwise_return)] = stepwise_return
            cumulative_return_arr[j, :len(cumulative_return_list)] = cumulative_return_list
            cumulative_return_arr[j, len(cumulative_return_list):] = cumulative_return_list[-1]

        # get the best 10 scores from the cumulative returns every time step
        cra = cumulative_return_arr.copy()
        cra[::-1, :].sort(axis=0)
        cra_copy = cra[:10, :].tolist()

        # save the 10 best scores of all policies in a dictionary
        best_scores[policy_name] = cra_copy
        # print(f"number of crashes with policy {policy_name}: {len(crash_at)}")
        x = np.arange(time_steps)

        axs[0, 0].scatter(x, np.median(stepwise_return_arr, axis=0), label=policy_name, alpha=0.5)
        axs[0, 0].fill_between(x, np.percentile(stepwise_return_arr, 25, axis=0),
                               np.percentile(stepwise_return_arr, 75, axis=0), alpha=0.2)
        axs[0, 0].set_title("median of stepwise returns")

        axs[0, 1].plot(np.median(cumulative_return_arr, axis=0), label=policy_name)
        axs[0, 1].set_title("median of cumulative returns")
        axs[0, 1].fill_between(x, np.percentile(cumulative_return_arr, 25, axis=0),
                               np.percentile(cumulative_return_arr, 75, axis=0), alpha=0.2)

        bins = get_integer_bins(crash_at)
        axs[1, 0].hist(crash_at, bins=bins,
                       alpha=0.5, rwidth=0.92, label=policy_name)
        axs[1, 0].set_title("Crash at")
        axs[1, 0].set_xticks(np.arange(len(bins)))

        bins = get_integer_bins(survival_at)
        axs[1, 1].hist(survival_at, bins=bins, alpha=0.5, rwidth=0.92, label=policy_name)
        axs[1, 1].set_title("Survival at")
        axs[1, 1].set_xticks(np.arange(len(bins)))

    axs[1, 1].legend(loc='lower left')
    fig.set_tight_layout(True)
    plt.show()
    # with open('best_score_list.json', 'w') as fp:
    #     json.dump(best_scores, fp)


def get_integer_bins(data):
    min_data = int(np.min(data))
    max_data = int(np.max(data))
    bins = np.arange(min_data, max_data + 2) - 0.5
    return bins


# compute the expected action value of next states for the brain points
def expected_next_state_value(V, env):
    actions = env.actions
    states = env.states
    Q = {}

    for state in states:
        d, k1, k2 = state

        for action in actions:

            q = 0

            next_states = env.step(state, action)
            for next_state, values in next_states.items():
                for value in values:
                    state_prob, reward = value
                    q += state_prob * V[next_state]
            Q[(d, k1, k2, action)] = q
    return Q


def parse_dict_key_to_string(optimal_V):
    optimal_V_str = optimal_V.copy()
    for key, value in optimal_V.items():
        key_str = str(key)
        optimal_V_str[key_str] = value
        optimal_V_str.pop(key)
    return optimal_V_str


def main():
    # parameters from the Environment#####################################
    gamma = 0.94
    env = Environment(gamma)

    total_distance = env.total_distance

    actions = env.actions
    states = env.states
    #########################################################################

    # get optimal policy, optimal state value and the policies when using only skill 1 or skill 2 respectively
    optimal_policy, optimal_V = policy_iteration(env)
    policy_only_skill_1 = {state: np.array([1, 0]) for state in states}
    policy_only_skill_2 = {state: np.array([0, 1]) for state in states}

    # print("optimal value: {}".format(optimal_V))
    # print(f"optimal policy: {optimal_policy}")
    ############################################################################

    # parse dictionar key to string and save to optimal_state_value json file for the exportation to javascript
    optimal_V_str = parse_dict_key_to_string(optimal_V)

    with open('../data/from_model/optimal_state_value.json', 'w') as fp:
        json.dump(optimal_V_str, fp)

    policies = {"optimal_policy": optimal_policy,
                "policy_only_skill_1": policy_only_skill_1,
                "policy_only_skill_2": policy_only_skill_2}
    ###########################################################################

    # plot comparison of the analytical result of vop and the result from dynamic programming,
    # the expected result should be a line of dots
    # my_vop = my_formula_vop(env)
    # paper_vop = paper_formula_vop(env, optimal_V)
    # plot_comparison_vop_dp(env, my_vop, optimal_V, states, total_distance)
    # plot_comparison_vop_dp(env, paper_vop, optimal_V, states, total_distance)

    ########################################################################################

    # print expected next state action value:
    Q = expected_next_state_value(optimal_V, env)
    Q_str = parse_dict_key_to_string(Q)
    with open('../data/from_model/expected_next_state_action_value.json', 'w') as fp:
        json.dump(Q_str, fp)
    ########################################################################################

    # plot heatmap of showing when it is better to use skill 2 rather than skill 1
    k1 = env.nS1
    k2 = env.nS2

    expected_steps = np.linspace(1.01, 8.0, 10)
    gammas = [1-(1/s) for s in expected_steps]
    efficacy_old_skill = np.linspace(0.1, 1.0, 10)
    ds = [1/e for e in efficacy_old_skill]
    z = np.zeros((10, 10))

    for i, gamma in enumerate(gammas):

        env = Environment(gamma)
        V1 = policy_evaluation(policy_only_skill_1, env)
        distances = np.arange(1, 11)
        vs1 = [V1[d, k1, k2] for d in distances]
        vs2_cont = my_formula_vop(env)

        # Interpolate, get the value of skill 1 with continuous d
        f = interpolate.interp1d(distances, vs1)
        # compute the discrepancy of skill 2 and skill 1 at current d and gamma
        for j, d in enumerate(ds):
            z[i, j] = vs2_cont[(10, k1, k2)] - f(d)

    fig, ax = plt.subplots()
    yticklabels = ['{:.1f}'.format(e_d) for e_d in expected_steps]

    xticklabels = ['{:.2}'.format(i_d) for i_d in efficacy_old_skill]

    vmin = np.min(z)
    vmax = -vmin  # Make sure that the colors are interesting

    sns.heatmap(z, annot=True,
                cmap='Spectral',
                vmin=vmin,
                vmax=vmax,
                fmt='.1f',
                center=0.0,
                xticklabels=xticklabels,
                yticklabels=yticklabels,
                ax=ax,
                cbar=False)

    # ax.set_title('How much better is skill 2 than skill 1?')

    ax.set_xlabel("Relative efficacy of old skill")

    ax.set_ylabel("Expected number of potential uses")
    fig.savefig('../paper/images/heatmap_value_difference_conti.pdf')

    plt.show()
    plt.close(fig)


    #######################################################################################

    # plot the simulated stepwise returns, cumulative returns,
    # and the crash rate/ survival rate at distance from 0 to 9
    # simulation(env, policies, time_steps=10, participant_num=1000)
    ####################################################################################


if __name__ == '__main__':
    main()
