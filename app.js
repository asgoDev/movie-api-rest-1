const express = require('express')
const crypto = require('node:crypto')
const cors = require('cors')
const movies = require('./movies.json')
const {validateMovie, validatePartialMovie} = require('./schemas/movies')

const app = express()
const PORT = process.env.PORT ?? 1234

app.use(express.json())
app.use(cors({
    origin: (origin, callback) =>{
        const ACCEPTED_ORIGINS = [
            'http://localhost:5500',
            'https://movies.com',
            'http://midu.dev',
        ]
        if(ACCEPTED_ORIGINS.includes(origin)) {
            return callback(null, true)
        }
        if(!origin) {
            return callback(null, true)
        }
        return callback(new Error('Not allowed by CORS'))
    }
}))
app.disable('x-powered-by')

app.get('/',(req, res)=>{
    res.json({message: 'hola mundo'})
})



app.get('/movies', (req,res)=>{
    const { genre } = req.query
    if(genre){
        const filteredMovies = movies.filter(movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))
        return res.json(filteredMovies)
    }
    res.json(movies)
})

app.get('/movies/:id', (req, res)=>{
    const {id}=req.params 
    const movie = movies.find(movie=> movie.id === id)
    if (movie) return res.json(movie)
        res.status(404).json({message: 'Movie not found'})
})

app.post('/movies', (req, res)=>{
    const result = validateMovie(req.body)
    if(result.error) { // alternativa if(!result.success)
        //aqui tambn se puede utilizar el codigo 422
        return res.status(400).json({message: JSON.parse(result.error.message)})
    }
    const newMovie = {
        id:crypto.randomUUID(), ...result.data
    }

    // Esto se hara solo por prueba. 
    // hacer esto hace que deje de ser un API REST, ya que segun los fundamentos de su arquitectura deberia ser Stateless, asi que no guarda ningun dato temporal
    movies.push(newMovie)
    ////

    // res.status(201).json(newmovie) // a veces es interesante devolver el recurso para actualizar la cache del cliente, y asi evitar hacer una nueva request con el nuevo recurso
    res.status(201).json({message: newMovie})
})

app.delete('/movies/:id', (req, res)=>{
    const {id} = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)
    if(movieIndex === -1) {
        return res.status(404).json({message: 'Movie not found'})
    } 
    movies.splice(movieIndex, 1)
    return res.json({message: 'Movie deleted'})
})

app.patch('/movies/:id', (req, res) =>{
    const result = validatePartialMovie(req.body)
    console.log(result); // esto es solo para ver que devuelve. No es necesario
    if (!result.success) {
        res.status(400).json({error:  JSON.parse(result.error.message)})
    }
    const {id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)
    if(movieIndex === -1) {
        return res.status(404).json({message: 'Movie not found'})
    }
    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }
    movies[movieIndex] = updateMovie
    return res.json(updateMovie)
})

// Al utilizar el middleware cors() tambien se evita utilizar el options 
//
// app.options('/movies/:id', (req, res)=>{
//     const origin = req.header('origin')
//     if(ACCEPTED_ORIGINS.includes(origin) || !origin) {
//         res.header('Access-Control-Allow-Origin', origin)
//         res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
//     }
//     res.sendStatus(200)
// })

app.listen(PORT, ()=>{
    console.log('server running on port', PORT);
    
})