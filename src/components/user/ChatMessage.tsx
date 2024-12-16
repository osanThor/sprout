import { useEffect, useState } from "react";
import images from "../../constants/images";
import UserItemSkeleton from "../common/skeleton/UserItemSkeleton";
import ChatItem from "./ChatItem";
import TextareaAutosize from "react-textarea-autosize";
import { useAuthStore } from "../../stores/authStore";
import { twMerge } from "tailwind-merge";
import { getChatList, postMessage, getMessageList } from "../../api/message";

interface ChatMessage {
  onClose: () => void;
}

export default function ChatMessage({ onClose }: ChatMessage) {
  const itemHeight = 50;
  const maxItems = 10;
  const containerHeight = maxItems * itemHeight;

  const loggedInUser = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState<boolean>(true);

  const [currentUser, setCurrentUser] = useState<{
    fullName: string;
    _id: string;
  } | null>(null);

  // 채팅 목록 가져오기
  const [list, setList] = useState<
    {
      message: string;
      receiver: { fullName: string; _id: string; image?: string };
      sender: { fullName: string; _id: string; image?: string };
    }[]
  >([]);
  const handleGetChatList = async () => {
    setLoading(true);
    try {
      const { data } = await getMessageList();
      setList(data.filter((item) => item.receiver._id !== item.sender._id));
    } catch (err) {
      console.error(`메시지 수신 실패` + err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetChatList();
  }, []);

  // 특정 유저와의 채팅 목록 모달 열기
  const handleSelectChat = (user: { fullName: string; _id: string }) => {
    if (!user._id) return console.error("user id가 없습니다");
    setCurrentUser(user);
    handleChatList(user._id);
  };

  // 특정 유저와의 채팅 목록 모달 닫기
  const handleCloseModal = () => {
    setCurrentUser(null);
    setMessages([]);
  };

  const [messages, setMessages] = useState<
    {
      message: string;
      messageId: string;
      senderId: string;
      receiverId: string;
      isReceived: boolean;
    }[]
  >([]);
  const [value, setValue] = useState<string>("");

  // 특정 유저와의 채팅 목록
  const handleChatList = async (userId?: string) => {
    if (!loggedInUser) return;
    if (!userId) return;
    try {
      const { data } = await getChatList({ id: userId });
      const filterMessages = data
        .map((chat: any) => ({
          message: chat.message,
          messageId: chat._id,
          senderId: chat.sender._id,
          receiverId: chat.receiver._id,
          isReceived: chat.receiver._id === loggedInUser._id,
        }))
        .reverse();

      setMessages(filterMessages);
    } catch (error) {
      console.error("messages를 불러오지 못함:", error);
    } finally {
    }
  };

  //채팅 방에서 메시지 보내기
  const handleSendMessage = async () => {
    if (!value.trim() || !loggedInUser || !currentUser) return;
    try {
      const { data } = await postMessage({
        message: value,
        receiver: currentUser._id,
      });
      setMessages((prev) => [
        {
          message: data.message,
          messageId: data._id,
          senderId: data.sender._id,
          receiverId: data.receiver._id,
          isReceived: data.receiver._id === loggedInUser._id,
        },
        ...prev,
      ]);
      setValue("");
    } catch (error) {
      console.error("메시지 전송 실패", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      e.nativeEvent.isComposing === false
    ) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <article className="w-[calc(100%-32px)] max-w-[600px] bg-white dark:bg-grayDark pt-5 pb-[30px] rounded-[8px] flex flex-col px-[44px]">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold">
          {currentUser ? currentUser.fullName : "대화 목록"}
        </h2>
        <button onClick={currentUser ? handleCloseModal : onClose}>
          <img className="dark:invert" src={images.Close} alt="close icon" />
        </button>
      </div>
      {/* 채팅 내용 */}
      <div
        className=" overflow-y-auto scroll"
        style={{ height: `${containerHeight}px` }}
      >
        {!currentUser ? (
          loading ? (
            <div className="w-full text-lg font-bold h-full flex flex-col gap-5">
              {Array(maxItems)
                .fill(0)
                .map((_, idx) => (
                  <UserItemSkeleton key={`receive-message-${idx}`} />
                ))}
            </div>
          ) : list.length > 0 ? (
            <ul className="flex flex-col gap-5">
              {list.map((item, idx) => {
                const reciver =
                  item.receiver._id === loggedInUser!._id
                    ? item.sender
                    : item.receiver;
                return (
                  <ChatItem
                    key={idx}
                    user={reciver}
                    msg={item.message}
                    onOpen={() => handleSelectChat(reciver)}
                  />
                );
              })}
            </ul>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray dark:text-whiteDark">
              "메시지가 존재하지 않습니다"
            </div>
          )
        ) : (
          // 채팅 상세보기
          <div className="flex flex-col h-full gap-5">
            <div className="flex-1 overflow-y-auto flex flex-col-reverse gap-5 scroll">
              {messages.map((msg) => (
                <div
                  key={msg.messageId}
                  className={`flex ${
                    msg.isReceived ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`${msg.isReceived ? "ml-[30px]" : "mr-[30px]"} ${
                      msg.isReceived ? "bg-whiteDark" : "bg-main"
                    } min-h-[50px] max-w-[342px] rounded-[8px] p-3`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className={twMerge(
                "w-full flex items-start px-5 py-[15px] border border-main rounded-[8px] mt-auto"
              )}
            >
              <TextareaAutosize
                className="w-full h-6 focus:outline-none  scroll resize-none bg-white dark:bg-black"
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                value={value}
                placeholder={`[${currentUser?.fullName}]에게 보낼 메시지를 작성해주세요`}
                maxRows={3}
              />
              <button
                className="mt-[2px] ml-1"
                type="submit"
                disabled={!value.trim()}
              >
                <img
                  src={value ? images.SendActive : images.Send}
                  alt="send icon"
                />
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}