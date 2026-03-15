from app import create_app
import os

app = create_app()

if __name__ == '__main__':
    # remove debug for prod
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    app.run(
        debug=debug_mode,
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000))
    )