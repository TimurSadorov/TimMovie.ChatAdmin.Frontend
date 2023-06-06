import React, { useEffect, useState } from 'react'
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport'
import './chatInPage.css'
import styled from 'styled-components'
import { Button } from 'antd'
import { ChatClient } from 'generated/chat.client'
import { ChatEvent, ChatMessage } from 'generated/chat'
import { ChatEventStatus } from 'generated/chat'

const App = () => {
    const queryParameters = new URLSearchParams(window.location.search)
    const name = queryParameters.get('name')

    const [client, setClient] = useState<ChatClient | null>(null)

    const [chatItems, setChatItems] = useState<(ChatMessage | ChatEvent)[]>([
        { body: 'sdadsa', name: 'asda' },
        { body: 'asdasdas', name: 'timur' },
    ])
    const [connectedToChat, setConnectedToChat] = useState(false)
    const [hasUser, setHasUser] = useState(false)

    const [message, setMessage] = useState('')

    useEffect(() => {
        const transport = new GrpcWebFetchTransport({
            baseUrl: 'http://localhost:5011',
        })

        setClient(new ChatClient(transport))
    }, [])

    const coonectToChat = async (client: ChatClient) => {
        const stream = client.connectSupportToChat({ name: name! })

        console.log('стрим запустился')
        setConnectedToChat(true)

        let isFirstMessage = true
        for await (const message of stream.responses) {
            if (isFirstMessage) {
                isFirstMessage = false
            } else {
                setChatItems((i) => [...i, message])
            }
        }
    }

    const coonectToEvents = async (client: ChatClient) => {
        const stream = client.connectToEvents({ name: name! })
        console.log('стрим эвент')

        let isFirstEvent = true
        for await (const event of stream.responses) {
            if (isFirstEvent) {
                isFirstEvent = false
            } else {
                if (event.status === ChatEventStatus.UserConnectToChat) {
                    setChatItems([])
                }
                if (event.status === ChatEventStatus.UserDisconnectFromChat) {
                    setHasUser(false)
                }
                setChatItems((i) => [...i, event])
            }
        }
    }

    useEffect(() => {
        if (client) {
            coonectToChat(client)
        }
    }, [client])

    useEffect(() => {
        if (client && connectedToChat) {
            coonectToEvents(client)
        }
    }, [connectedToChat])

    const sendMessage = async (message: string) => {
        if (!client) return

        await client.sendMessage({ body: message, name: name! })
        setMessage('')
    }

    const dissconnect = async () => {
        if (!client) return
        setHasUser(() => false)
        await client.disconnectSupportFromChat({ name: name! })
    }

    if (!name) {
        return <div>Ошибка!</div>
    }

    return (
        <div className="d-flex flex-column mt-4 chat-page__container">
            <ManagementButtons>
                <Button disabled={!hasUser} onClick={dissconnect}>
                    Выйти из чата
                </Button>
            </ManagementButtons>
            <div className="d-flex flex-column mt-2 chat-in-page__container">
                <div className="d-flex align-items-center p-3 ps-5 chat-in-page__header"></div>
                <div className="chat-in-page__body" id="chatBody">
                    {chatItems.map((m, i) =>
                        'name' in m ? (
                            m.name === name ? (
                                <SelfMessageContainer key={i}>
                                    <div className="chat-in-page__sent-messages">{m.body}</div>
                                </SelfMessageContainer>
                            ) : (
                                <UserMessageContainer key={i}>
                                    <div className="chat-in-page__received-messages">{m.body}</div>
                                </UserMessageContainer>
                            )
                        ) : (
                            <NotificationContainer key={i}>
                                <div className="chat-in-page__notification-in-chat">{m.body}</div>
                            </NotificationContainer>
                        ),
                    )}
                </div>
                <div className="chat-in-page__input">
                    <Container>
                        <div className="chat-in-page__input__message-container">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="chat-in-page__input__message-input"
                                id="messageInput"
                                placeholder="Сообщение"
                            ></textarea>
                        </div>
                        <SendContainer>
                            <div
                                className="chat-in-page__input__send-btn"
                                id="sendMessageBtn"
                                onClick={() => sendMessage(message)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="23"
                                    fill="currentColor"
                                    className="bi bi-send-fill"
                                    viewBox="0 0 16 16"
                                >
                                    <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
                                </svg>
                            </div>
                        </SendContainer>
                    </Container>
                </div>
            </div>
        </div>
    )
}

const Container = styled.div`
    display: flex;
    align-items: center;
    flex-grow: 1;
    margin-left: 10px;
    margin-bottom: 10px;
`

const SendContainer = styled.div`
    align-items: center;
    margin-right: 1%;
`

const ManagementButtons = styled.div`
    display: flex;
    align-items: center;
`

const SelfMessageContainer = styled.div`
    display: flex;
    justify-content: end;
    margin-bottom: 1%;
    margin-top: 1%;
`
const UserMessageContainer = styled.div`
    display: flex;
    margin-bottom: 1%;
    margin-top: 1%;
`

const NotificationContainer = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 1%;
    margin-top: 1%;
`

export default App
