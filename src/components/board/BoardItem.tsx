import { useNavigate } from "react-router";
import images from "../../constants/images";
import Comments from "./Comments";
import { useState, useEffect } from "react";
import { PostItem, createLike, deleteLike, getPostById } from "../../api/board";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import Avata from "../common/Avata";

import { useAuthStore } from "../../stores/authStore";
import { postNotification } from "../../api/notification";
import { useModal } from "../../stores/modalStore";
import { useTheme } from "../../stores/themeStore";
import { twMerge } from "tailwind-merge";
import calculateTimeDifference from "../../utils/calculateTimeDifference";

interface Props {
  isDetail?: boolean;
  post: PostItem;
  channelId: string;
}

export default function BoardItem({ isDetail, post, channelId }: Props) {
  const { createdAt, likes, comments, _id: postId, author } = post;
  const isDark = useTheme((state) => state.isDarkMode);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const exactDate = new Date(createdAt).toLocaleString();
  const [likeId, setLikeId] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(likes.length);
  const setOpen = useModal((state) => state.setModalOpen);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [commentsCount, setCommentsCount] = useState(comments.length);
  const postImages = JSON.parse(post.title).images;

  const updateCommentCount = (newCount: number) => {
    setCommentsCount(newCount);
  };
  const handleLikeModal = () => {
    setOpen(true, {
      message: "로그인 후 좋아요를 눌러주세요!",
      btnText: "확인",
      btnColor: "main",
      onClick: () => {
        setOpen(false);
        navigate("/auth/signIn");
      },
    });
  };
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const post = await getPostById(postId);
        if (!user) return;
        const currentUserLike = post.likes.find(
          (like: { user: string }) => like.user === user._id
        );
        if (currentUserLike) setLikeId(currentUserLike._id);
        else setLikeId(null);
      } catch (error) {
        console.error(error);
      }
    };

    fetchPostData();
    Fancybox.bind(`[data-fancybox="gallery-${postId}"]`);
  }, [postId, user]);

  const handleLikeClick = async () => {
    if (!isLoggedIn) return handleLikeModal();
    try {
      const response = likeId
        ? await deleteLike(likeId)
        : await createLike(postId);

      const updatedPost = await getPostById(postId);
      setLikeCount(updatedPost.likes.length);
      if (!likeId && response) {
        setLikeId(response._id);
        if (user && user._id !== author._id)
          await postNotification({
            notificationType: "LIKE",
            notificationTypeId: response._id,
            userId: author._id,
            postId,
          });
      } else setLikeId(null);
    } catch (error) {
      console.error(`좋아요 ${likeId ? "취소" : "추가"} 중 오류 발생:`, error);
    }
  };

  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>(
    new Array(postImages.length).fill(false)
  );

  useEffect(() => {
    const loadImages = () => {
      postImages.forEach((url: string, index: number) => {
        if (!imagesLoaded[index]) {
          const img = new Image();
          img.src = url;
          img.onload = () => {
            setImagesLoaded((prevState) => {
              const updated = [...prevState]; // 기존 상태를 복사
              updated[index] = true; // 해당 인덱스의 값을 true로 설정
              return updated; // 새로운 상태를 반환
            });
          };
        }
      });
    };

    loadImages();
  }, [postImages]); // postImages가 변경될 때마다 다시 실행

  const mainContents = (
    <div className="w-full max-w-[777px] flex flex-col items-start gap-5">
      <div
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/user/${author._id}`);
        }}
        className="flex gap-[10px] items-center cursor-pointer"
      >
        <Avata profile={author.image} size={"md"} />
        <div>
          <h3 className="font-bold line-clamp-1">{author.fullName}</h3>
          <p className="text-sm text-gray dark:text-whiteDark">
            {author.email}
          </p>
        </div>
      </div>
      <div className="w-full pl-[89px]">
        <div className="w-full max-w-[688px] font-medium flex flex-col gap-[10px]">
          {/* 게시물 내용 */}
          <div className="whitespace-pre-line">
            {JSON.parse(post.title).text}
          </div>
          {/* 이미지 */}
          <div
            className={twMerge(
              "w-full grid gap-[10px]",
              postImages.length > 1 ? "grid-cols-2" : ""
            )}
          >
            {postImages.length > 0 &&
              postImages.map((url: string, i: number) => (
                <div key={i}>
                  <a href={postImages[i]} data-fancybox={`gallery-${postId}`}>
                    <div
                      className={twMerge(
                        "w-full bg-whiteDark rounded-[8px] bg-cover bg-center",
                        postImages.length === 1 &&
                          "aspect-[688/450] min-h-[150px]",
                        postImages.length === 2 &&
                          "aspect-[399/450] min-h-[150px]",
                        postImages.length > 2 &&
                          "aspect-[399/300] min-h-[100px]",
                        imagesLoaded[i]
                          ? "opacity-100"
                          : "opacity-0 animate-pulse"
                      )}
                      style={{
                        backgroundImage: imagesLoaded[i]
                          ? `url(${url})`
                          : undefined,
                      }}
                    />
                  </a>
                </div>
              ))}
          </div>
          {/* 하단 컨텐츠 */}
          <div className="flex justify-between mt-[10px] text-sm px-[5px]">
            <div className="flex items-center gap-[30px]">
              <button className="flex items-center gap-[10px]">
                <img
                  src={isDark ? images.darkComment : images.CommentSvg}
                  alt="comment icon"
                  className="dark:block "
                />
                {commentsCount}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleLikeClick();
                }}
                className="flex items-center gap-[10px]"
              >
                <img
                  src={likeId ? images.like_fill : images.darkLike}
                  alt="like icon"
                  className="dark:block hidden"
                />
                <img
                  src={likeId ? images.like_fill : images.Like}
                  alt="like icon"
                  className="dark:hidden block"
                />
                {likeCount}
              </button>
            </div>
            <div className="text-gray dark:text-whiteDark relative group">
              {calculateTimeDifference(createdAt)}
              <div className="hidden group-hover:block absolute w-[156px] text-xs p-2 rounded-lg -top-[40px] left-1/2 transform -translate-x-1/2 z-10bg-black bg-black text-white dark:bg-whiteDark dark:text-black">
                {exactDate}
              </div>
            </div>
          </div>
          {/* 댓글 */}
          {isDetail && (
            <Comments
              comments={comments}
              postId={postId}
              userId={author._id}
              updateCommentCount={updateCommentCount}
            />
          )}
        </div>
      </div>
    </div>
  );

  if (isDetail)
    return (
      <div className="p-[30px] flex flex-col items-center">{mainContents}</div>
    );

  return (
    <div
      onClick={(e) => {
        // 클릭 시 페이지 이동을 막고, Fancybox가 열리도록
        const target = e.target as HTMLElement;
        if (!target.closest("[data-fancybox]")) {
          navigate(`/board/${channelId}/${postId}`);
        }
      }}
      className="p-[30px] border-b border-whiteDark dark:border-gray flex flex-col items-center transition-all hover:bg-whiteDark/30 dark:hover:bg-grayDark cursor-pointer"
    >
      {mainContents}
    </div>
  );
}