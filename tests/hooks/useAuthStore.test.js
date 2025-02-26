import { configureStore } from "@reduxjs/toolkit";
import { authSlice } from "../../src/store";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAuthStore } from "../../src/hooks";
import { Provider } from "react-redux";
import { initialState, notAuthenticatedState } from "../fixtures/authStates";
import { testUserCredentials } from "../fixtures/testUser";
import { calendarApi } from "../../src/api";

const getMockStore = (initialState) => {
    return configureStore({
        reducer: {
            auth: authSlice.reducer,
        },
        preloadedState: {
            auth: { ...initialState }
        }
    })
}

describe('Tests in useAuthStore', () => {

    beforeEach(() => localStorage.clear());


    test('should return the default values', () => {

        const mockStore = getMockStore({ ...initialState });

        const { result } = renderHook(() => useAuthStore(), {
            wrapper: ({ children }) => <Provider store={mockStore}> {children} </Provider>
        });

        expect(result.current).toEqual({
            errorMessage: undefined,
            status: 'checking',
            user: {},
            checkAuthToken: expect.any(Function),
            startLogin: expect.any(Function),
            startLogout: expect.any(Function),
            startRegister: expect.any(Function),
        });
    });

    test('startLogin must login correctly', async () => {

        const mockStore = getMockStore({ ...notAuthenticatedState });
        const { result } = renderHook(() => useAuthStore(), {
            wrapper: ({ children }) => <Provider store={mockStore}> {children} </Provider>
        });

        await act(async () => {
            await result.current.startLogin(testUserCredentials);
        });

        const { errorMessage, status, user } = result.current;
        expect({ errorMessage, status, user }).toEqual({
            errorMessage: undefined,
            status: 'authenticated',
            user: { name: 'Test User', uid: '67b74bdbf2d786037c730d0d' }
        });


        expect(localStorage.getItem('token')).toEqual(expect.any(String));
        expect(localStorage.getItem('token-init-date')).toEqual(expect.any(String));

    });


    test('startLogin must fail authentication ', async () => {

        const mockStore = getMockStore({ ...notAuthenticatedState });
        const { result } = renderHook(() => useAuthStore(), {
            wrapper: ({ children }) => <Provider store={mockStore}> {children} </Provider>
        });

        await act(async () => {
            await result.current.startLogin({ email: 'something@google.com', password: '123456789' });
        });

        const { errorMessage, status, user } = result.current;

        expect(localStorage.getItem('token')).toBe(null);
        expect({ errorMessage, status, user }).toEqual({
            errorMessage: 'Incorrect credentials',
            status: 'not-authenticated',
            user: {}
        });

        waitFor(
            () => expect(result.current.errorMessage).toBe(undefined)
        );
    });


    test('startRegister must create an user', async () => {


        const newUser = { email: 'something@google.com', password: '123456789', name: 'Test User 2' };

        const mockStore = getMockStore({ ...notAuthenticatedState });
        const { result } = renderHook(() => useAuthStore(), {
            wrapper: ({ children }) => <Provider store={mockStore}> {children} </Provider>
        });

        const spy = jest.spyOn(calendarApi, 'post').mockReturnValue({
            data: {
                ok: true,
                uid: 'sadasdasda',
                name: 'Test User',
                token: 'Any Token',
            }
        });

        await act(async () => {
            await result.current.startRegister(newUser);
        });

        const { errorMessage, status, user } = result.current;

        spy.mockRestore();

    });

    test('startRegister must fail creation', async () => {

        const mockStore = getMockStore({ ...notAuthenticatedState });
        const { result } = renderHook(() => useAuthStore(), {
            wrapper: ({ children }) => <Provider store={mockStore}> {children} </Provider>
        });

        await act(async () => {
            await result.current.startRegister(testUserCredentials);
        });

        const { errorMessage, status, user } = result.current;

        expect({ errorMessage, status, user }).toEqual({
            errorMessage: "User exists with this email",
            status: 'not-authenticated',
            user: {}
        });
    });

    test('checkAuthToken must fail if there is no token', async () => {

        const mockStore = getMockStore({ ...notAuthenticatedState });
        const { result } = renderHook(() => useAuthStore(), {
            wrapper: ({ children }) => <Provider store={mockStore}> {children} </Provider>
        });

        await act(async () => {
            await result.current.checkAuthToken();
        });

        const { errorMessage, status, user } = result.current;
        expect({ errorMessage, status, user }).toEqual({
            errorMessage: undefined,
            status: 'not-authenticated',
            user: {}
        });
    });

    test('checkAuthToken must authenticate user if there is a token', async () => {

        const { data } = await calendarApi.post('/auth', testUserCredentials)
        localStorage.setItem('token', data.token);

        const mockStore = getMockStore({ ...notAuthenticatedState });
        const { result } = renderHook(() => useAuthStore(), {
            wrapper: ({ children }) => <Provider store={mockStore}> {children} </Provider>
        });

        await act(async () => {
            await result.current.checkAuthToken();
        });

        const { errorMessage, status, user } = result.current;

        console.log({ errorMessage, status, user });
        expect({ errorMessage, status, user }).toEqual({
            errorMessage: undefined,
            status: 'authenticated',
            user: { name: 'Test User', uid: '67b74bdbf2d786037c730d0d' }     
        });

    });

    // startLogout -> Pending


});