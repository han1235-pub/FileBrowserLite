using System.Drawing;
using System.IO;
using System.Net;
using System.Runtime.CompilerServices;

    public class FileSystem
    {
        private readonly string _rootDirectory;
        
        public FileSystem(IConfiguration configuration)
        {
            _rootDirectory = configuration["FileBrowser:RootDirectory"] ?? throw new NullReferenceException("Root directory not configured.");

        }

        //check if things really exists in this folder, if so return the full path
        public string GetCurrPath(string revPath)
        {
            string fullRoot = Path.GetFullPath(_rootDirectory);
            string fullPath = Path.GetFullPath(Path.Combine(fullRoot, revPath));

            string[] fullRootComp = fullRoot.Split(Path.DirectorySeparatorChar);
            string[] fullPathComp = fullPath.Split(Path.DirectorySeparatorChar);
            
            if(fullPathComp[1].CompareTo(fullRootComp[1]) != 0)
            {
                throw new UnauthorizedAccessException();
            }

            return fullPath;
        }

        public string CreateFolder(string dest, string name) 
        {
            string fullDest = GetCurrPath(Path.Combine(dest, name));
            Directory.CreateDirectory(fullDest);
            return fullDest;
        }

        public void Upload(string dest, IFormFile file)
        {
            // string folder = CreateFolder(dest, file.FileName);
            // string destination = Path.Combine(folder, Path.GetFileName(file.FileName));
            using var stream = new FileStream(Path.Combine(dest, Path.GetFileName(file.FileName)), FileMode.Create);
            file.CopyTo(stream);
        }

        public Stream Download(string path)
        {
            string target = GetCurrPath(path);
            if (!File.Exists(target))
            {
                throw new FileNotFoundException();
            }
            return File.OpenRead(target);
        } 

        public BrowserResponse Browse(string path)
        {
            // Console.WriteLine("Backend starts browsing");

            string actualPath = GetCurrPath(path);
            // Console.WriteLine($"Accessing: {actualPath}");
            // Console.WriteLine($"Relative: {path}");
            // Console.WriteLine($"Exists: {Directory.Exists(actualPath)}");


            if (!Directory.Exists(actualPath))
            {
                throw new DirectoryNotFoundException();
            }

            string[] allDirs = Directory.GetDirectories(actualPath);
            string[] allFiles = Directory.GetFiles(actualPath);
            var allItems = new List<FileItem>();

            foreach (string dir in allDirs)
            {
                allItems.Add(new FileItem
                {
                    Name = Path.GetFileName(dir) ?? "",
                    RevPath = Path.GetRelativePath(_rootDirectory, dir),
                    Type = "folder",
                    Size = null,
                });
            }

            long totalSize = 0;
            foreach (string currFile in allFiles)
            {
                var info = new FileInfo(currFile);
                allItems.Add(new FileItem
                {
                    Name = info.Name,
                    RevPath = Path.Combine(path ?? "", info.Name),
                    Type = "file",
                    Size = info.Length,
                });
                totalSize += info.Length;
            }

            return new BrowserResponse
            {
                CurrentPath = actualPath,
                Items = allItems,
                Summary = new FolderSummary
                {
                    FolderCount = allDirs.Length,
                    FileCount = allFiles.Length,
                    TotalFileSize = totalSize
                }
            };
        }

        public List<FileItem> Search(string revPath, string searchTerm)
        {
            string path = GetCurrPath(revPath);
            return Directory.EnumerateFileSystemEntries(path, "*", SearchOption.AllDirectories).Where(x => Path.GetFileName(x).Contains(searchTerm, StringComparison.OrdinalIgnoreCase)).Select(x =>
            {
                bool isDir = Directory.Exists(x);

                return new FileItem
                {
                    Name = Path.GetFileName(x),
                    RevPath = Path.GetRelativePath(_rootDirectory, x),
                    Type = isDir ? "Folder" : "File",
                    Size = isDir ? null : new FileInfo(x).Length
                };
            }).ToList();
        }
    }

