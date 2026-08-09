using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/files")]
public class FilesController : Controller
{
    private readonly FileSystem _server;
    
    public FilesController(FileSystem server)
    {
        _server = server;
    }

    [HttpGet("browse")]
    public IActionResult Browse(string path = "")
    {
        //Console.WriteLine("Received browse request");
        return Ok(_server.Browse(path));
    }

    [HttpGet("search")]
    public IActionResult Search(string path = "", string searchTerm = "")
    {
        return Ok(_server.Search(path, searchTerm));
    }

    [HttpPost("upload")] 
    public IActionResult Upload(IFormFile file, string path = "")
    {
        //Console.WriteLine("received upload request");
        _server.Upload(path, file);
        return Ok();
    }

    [HttpGet("download")]
    public IActionResult Download(string path)
    {
        var stream = _server.Download(path);

        return File(stream, "application/octet-stream", Path.GetFileName(path));
    }

    [HttpPost("createfolder")] 
    public IActionResult CreateFolder(string name, string path = "")
    {
        Console.WriteLine($"Receive new folder requested\nDestination: {path}\tName: {name}");
        _server.CreateFolder(path, name);
        return Ok();
    }

}