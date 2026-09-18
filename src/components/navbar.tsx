import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="bg-gray-100">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <div>
              <div className="flex items-center py-3 px-1.5 text-gray-700 hover:text-gray-900">
                <Image
                  src="/dog.svg"
                  alt="DOGimg Logo"
                  className="rounded-full"
                  width={32}
                  height={32}
                />
                <span className="ml-1.5 text-base font-bold">DOGimg</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <a
              href="https://github.com/zeikar/dogimg"
              target="_blank"
              rel="noreferrer"
            >
              <Image
                src="/github-mark.svg"
                alt="Github"
                width={30}
                height={30}
              />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
